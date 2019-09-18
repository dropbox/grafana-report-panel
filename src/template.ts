import _ from 'lodash';
import Handlebars from './vendors/handlebars';
import {makeEvalEnv} from './env';
import {callTypedFunction, safeEval} from './eval';
import {ReportData, TimeRange} from './types';

// We cache the compiled template and only update on input changes.
export let cache: {
  template: Function;
  lastContent: string;
  lastData: ReportData;
  lastTimeRange: TimeRange;
} | null = null;

// Helper to output a safe error string.
function safeError(err: string | Error): string /* string-ish */ {
  return new Handlebars.SafeString(
    `<span style="color:red">${Handlebars.escapeExpression(err.toString())}</span>`
  );
}

/**
 * Compile the handlebars template.
 */
export function compileTemplate(rawContent: string, data: ReportData, timeRange: TimeRange) {
  const cachedTemplate = getTemplateFromCache(rawContent, data, timeRange);
  if (cachedTemplate) {
    return cachedTemplate;
  }

  // For security, we force all handlebars variables to be escaped.
  const sanitizedContent = rawContent.replace(/\{\{\{([^\}]+)\}\}\}/g, '{{$1}}');

  // Register our custom helpers.
  registerHelpers(data, timeRange);

  // Compile the template.
  cache = {
    template: Handlebars.compile(sanitizedContent),
    lastContent: rawContent,
    lastData: data,
    lastTimeRange: timeRange,
  };

  return cache.template;
}

/**
 * Checks if the input params to the compilation process have changed and returns the cached
 * template if they have not.
 */
function getTemplateFromCache(rawContent: string, data: ReportData, timeRange: TimeRange) {
  if (
    cache &&
    _.isEqual(rawContent, cache.lastContent) &&
    _.isEqual(data, cache.lastData) &&
    _.isEqual(timeRange, cache.lastTimeRange)
  ) {
    return cache.template;
  }
  return null;
}

/**
 * Register our custom helpers.
 */
function registerHelpers(data: ReportData, timeRange: TimeRange) {
  const env = makeEvalEnv(data, timeRange);

  // Create a helper to eval (concats args together to form the expression).
  // tslint:disable-next-line:no-any
  Handlebars.registerHelper('eval', function(...args: any[]) {
    let options = args[args.length - 1];
    let expr: string;
    if (options.fn) {
      // tslint:disable-next-line:no-invalid-this
      expr = options.fn(this, options);
    } else {
      expr = args.slice(0, args.length - 1).join('');
    }
    try {
      return new Handlebars.SafeString(safeEval(env, expr));
    } catch (err) {
      return safeError(err);
    }
  });

  // Create helpers for each of the EvalEnv functions. If called in block form, they set the
  // return value as the inner `this` context. Useful for composition.
  _.each(env.functions, (func, name) => {
    // tslint:disable-next-line:no-any
    Handlebars.registerHelper(name, function(...args: any[]) {
      let options = args[args.length - 1];
      try {
        let ret = callTypedFunction(name, func, args.slice(0, args.length - 1));
        if (options.fn) {
          return options.fn(ret, {blockParams: [ret]});
        } else {
          return new Handlebars.SafeString(ret);
        }
      } catch (err) {
        return safeError(err);
      }
    });
  });

  // Create a helper to order an array via lodash.orderBy. Does not mutate the input array, instead
  // it exposes the sorted array as {{this}} (or blockParam) in the nested template context.
  //
  // Example Usage:
  //
  //    {{#orderBy series "stats.avg" "asc" as |orderedSeries|}}
  //        {{#each orderedSeries}}{{label}}{{/each}}
  //    {{/orderBy}}
  //
  // tslint:disable-next-line:no-any
  Handlebars.registerHelper('orderBy', function(collection: any[] | {}, ...args: any[]) {
    let options = args.pop();
    if (!options.fn) {
      return safeError(
        '`orderBy` can only be used as a block helper like: {{#orderBy collection "prop" "asc"}}{{/orderBy}}'
      );
    }

    // Convert ['propA', 'dirA', 'propB', 'dirB', ....] to [['propA', 'propB'], ['dirA', 'dirB']]
    // Lodash seems to recover pretty gracefully if you pass 'bad' iteratees so we don't need
    // to validate.
    let iteratees = [[], []];
    while (args.length) {
      iteratees[0].push(args.shift());
      if (args.length) {
        iteratees[1].push(args.shift());
      }
    }

    try {
      let ordered = _.orderBy(collection, ...iteratees);
      return options.fn(ordered, {blockParams: [ordered]});
    } catch (err) {
      return safeError(err);
    }
  });
}
