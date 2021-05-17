/*
 * Copyright (c) 2021 Dropbox, Inc
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

import {utils} from './vendors/remarkable.js';
import {safeEval} from './eval';
import {makeEvalEnv} from './env';
import {ReportData, TimeRange, RuleState} from './types';

export function imageRule(tokens, idx, options /*, env */) {
  const src = ' src="' + utils.escapeHtml(tokens[idx].src) + '"';
  const title = tokens[idx].title
    ? ' title="' + utils.escapeHtml(utils.replaceEntities(tokens[idx].title)) + '"'
    : '';
  const alt =
    ' alt="' +
    (tokens[idx].alt
      ? utils.escapeHtml(utils.replaceEntities(utils.unescapeMd(tokens[idx].alt)))
      : '') +
    '"';
  const dim = tokens[idx].height
    ? ' height="' +
      utils.escapeHtml(tokens[idx].height) +
      '" width="' +
      utils.escapeHtml(tokens[idx].width) +
      '"'
    : '';
  const suffix = options.xhtmlOut ? ' /' : '';
  return '<img' + src + alt + title + dim + suffix + '>';
}

export function imgSize(state: RuleState, silent: boolean): boolean {
  let found: boolean = false;
  const start: number = state.pos;
  const max: number = state.posMax;

  if (state.tokens.length === 0 || state.tokens[state.tokens.length - 1].type !== 'image') {
    return false;
  }
  if (state.src.charCodeAt(start) !== 0x7b /* { */) {
    return false;
  }
  if (state.level >= state.options.maxNesting) {
    return false;
  }

  if (start + 1 >= max) {
    return false;
  }

  state.pos = start + 1;

  while (state.pos < max) {
    if (state.src.charCodeAt(state.pos) === 0x7d /* } */) {
      found = true;
      break;
    }

    state.parser.skipToken(state);
  }

  if (!found || start + 2 === state.pos) {
    state.pos = start;
    return false;
  }

  const expr: string = state.src.slice(start + 1, state.pos);
  const match = expr.match(/\s*height=([0-9]+)\s*,\s*width=([0-9]+)/);
  if (!match) {
    state.pos = start;
    return false;
  }

  if (!silent) {
    const imageToken = state.tokens.pop();
    state.push({
      type: 'image',
      src: imageToken.src,
      title: imageToken.title,
      alt: imageToken.alt,
      level: state.level,
      height: match[1],
      width: match[2],
    });
  }

  state.posMax = state.pos + 1;
  state.pos = max;
  return true;
}

export function dataRule(state: RuleState, silent: boolean): boolean {
  const data: ReportData = state.env.data;
  const timeRange: TimeRange = state.env.timeRange;

  if (state.level >= state.options.maxNesting) {
    return false;
  }
  if (silent) {
    return false;
  }

  const match = /^\$\[([^\]]+)\]/.exec(state.src.slice(state.pos));
  if (!match) {
    return false;
  }

  if (data) {
    const expr = match[1];
    const env = makeEvalEnv(data, timeRange);
    let result: string; // Hack to get toString() typing.

    try {
      result = safeEval(env, expr);
    } catch (e) {
      result = `<span style="color:red">${utils.escapeHtml(e.toString())}</span>`;
    }
    state.push({type: 'htmltag', level: state.level, content: result.toString()});
  } else {
    state.push({type: 'text', level: state.level, content: '(Loading...)'});
  }

  state.pos += match[0].length;
  return true;
}
