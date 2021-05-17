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

import {EvalEnv, ensureNumber, ensureString, optional, oneOf, TypedFunction} from './eval';
import {ReportData, TimeRange} from './types';

const statGetter: (data: ReportData, stat: string) => TypedFunction = (data, stat) => ({
  argValidators: [
    series => {
      if (!data.series.hasOwnProperty(series)) {
        throw `no series named ${series}`;
      }
    },
  ],
  impl: series => data.series[series].stats[stat],
});

export function makeEvalEnv(data: ReportData, timeRange: TimeRange): EvalEnv<ReportData> {
  const functions = {
    /**
     * Styling helpers.
     */
    thresholdStyles: {
      argValidators: [
        ensureNumber,
        ensureNumber,
        ensureString,
        ensureNumber,
        ensureString,
        ensureNumber,
        ensureString,
      ],
      impl: (value, precision, ls, l, ms, h, hs) =>
        `<span class="${value < l ? ls : value < h ? ms : hs}">${value.toFixed(precision)}</span>`,
    },
    threshold: {
      argValidators: [
        ensureNumber,
        ensureString,
        ensureNumber,
        ensureString,
        ensureNumber,
        ensureString,
      ],
      impl: (value, ls, l, ms, h, hs) => (value < l ? ls : value < h ? ms : hs),
    },
    style: {
      argValidators: [ensureString, () => {}],
      impl: (classes, x) => `<span class="${classes}">${x.toString()}</span>`,
    },

    /**
     * Value converters.
     */
    toFixed: {argValidators: [ensureNumber, ensureNumber], impl: (x, prec) => x.toFixed(prec)},
    toKMGT: {
      argValidators: [ensureNumber, ensureNumber],
      impl: (x, prec) => {
        for (let [exp, suffix] of [[12, 'T'], [9, 'G'], [6, 'M'], [3, 'K']] as [number, string][]) {
          if (x > 10 ** exp) {
            return `${(x / 10 ** exp).toFixed(prec)}${suffix}`;
          }
        }
        return x.toFixed(prec);
      },
    },

    /**
     * Stat getters.
     */
    max: statGetter(data, 'max'),
    min: statGetter(data, 'min'),
    avg: statGetter(data, 'avg'),
    val: statGetter(data, 'val'),
    first: statGetter(data, 'first'),
    current: statGetter(data, 'current'),
    startDate: {argValidators: [ensureString], impl: (fmt: string) => timeRange.from.format(fmt)},
    endDate: {argValidators: [ensureString], impl: (fmt: string) => timeRange.to.format(fmt)},

    /**
     * Join strings/numbers together with a delimiter.
     */
    join: {
      argValidators: [
        ensureString,
        oneOf(ensureString, ensureNumber),
        optional(oneOf(ensureString, ensureNumber)),
        optional(oneOf(ensureString, ensureNumber)),
        optional(oneOf(ensureString, ensureNumber)),
        optional(oneOf(ensureString, ensureNumber)),
        optional(oneOf(ensureString, ensureNumber)),
      ],
      impl: (delim: string, ...values: (string | number)[]) => {
        return values.join(delim);
      },
    },
  };
  return {functions, data};
}
