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

import {MarkdownRenderer} from './renderer';
import {cache} from './template';

function wrapped(str: string) {
  return `<p>${str}</p>\n`;
}

function errWrapped(err: string) {
  return wrapped(`<span style="color:red">${err}</span>`);
}

describe('MarkdownRenderer', () => {
  let mr: MarkdownRenderer;
  const mockData = {series: {}, variables: {}};
  const mockTimeRange = {};

  beforeEach(() => {
    mr = new MarkdownRenderer();
  });

  describe('eval', () => {
    it('renders normal objects as HTML tags', () => {
      expect(mr.render('$[1]', mockData, mockTimeRange)).toEqual(wrapped('1'));
      expect(mr.render('$["1"]', mockData, mockTimeRange)).toEqual(wrapped('1'));
      expect(mr.render('$["<span>hi</span>"]', mockData, mockTimeRange)).toEqual(
        wrapped('<span>hi</span>')
      );
    });

    it('catches errors', () => {
      expect(mr.render('$[some invalid syntax]', mockData, mockTimeRange)).toEqual(
        errWrapped('Error: Line 1: Unexpected identifier')
      );
    });

    it('escapes errors, to make their messages clearer', () => {
      expect(mr.render('$[max("<>")]', mockData, mockTimeRange)).toEqual(
        errWrapped('Error: argument 1 to max is ill-typed: no series named &lt;&gt;')
      );
    });
  });

  describe('handlebars', () => {
    it('escapes variables even with {{{var}}}', () => {
      const data: any = {myVar: '<script>alert("haha!")</script>'}; // tslint:disable-line:no-any
      expect(mr.render('{{myVar}}', data, mockTimeRange)).toEqual(
        wrapped('&lt;script&gt;alert(“haha!”)&lt;/script&gt;')
      );
      expect(mr.render('{{{myVar}}}', data, mockTimeRange)).toEqual(
        wrapped('&lt;script&gt;alert(“haha!”)&lt;/script&gt;')
      );
    });

    it('can use `eval` as an inline helper', () => {
      expect(mr.render('{{eval "1+1"}}', mockData, mockTimeRange)).toEqual(wrapped('2'));
    });

    it('can use `eval` as a block helper', () => {
      expect(mr.render('{{#eval}} 1 + 1 {{/eval}}', mockData, mockTimeRange)).toEqual(wrapped('2'));
    });

    it('can use `join` as a block or inline helper', () => {
      expect(mr.render('{{join ", " "foo" "bar" 1 2}}', mockData, mockTimeRange)).toEqual(
        wrapped('foo, bar, 1, 2')
      );
      expect(
        mr.render('{{#join "-" "foo" "bar" as |str|}}{{str}}{{/join}}', mockData, mockTimeRange)
      ).toEqual(wrapped('foo-bar'));
    });

    it('can use `orderBy` helper only in block form', () => {
      expect(mr.render('{{orderBy series}}', mockData, mockTimeRange)).toMatch(
        '`orderBy` can only be used as a block helper'
      );
    });

    it('can use `orderBy` helper', () => {
      const data = {
        ...mockData,
        series: {a: {name: 'a4', val: 4}, b: {name: 'b2', val: 2}, c: {name: 'a3', val: 3}},
      };

      // One property with default direction.
      expect(
        mr.render(
          '{{#orderBy series "val"}}{{#each this}}{{name}} {{/each}}{{/orderBy}}',
          data,
          mockTimeRange
        )
      ).toEqual(wrapped('b2 a3 a4'));

      // One property with desc direction.
      expect(
        mr.render(
          '{{#orderBy series "val" "desc"}}{{#each this}}{{name}} {{/each}}{{/orderBy}}',
          data,
          mockTimeRange
        )
      ).toEqual(wrapped('a4 a3 b2'));

      // One property with desc direction using blockParam
      expect(
        mr.render(
          '{{#orderBy series "val" "desc" as |sorted|}}{{#each sorted}}{{name}} {{/each}}{{/orderBy}}',
          data,
          mockTimeRange
        )
      ).toEqual(wrapped('a4 a3 b2'));

      // Multiple properties
      expect(
        mr.render(
          '{{#orderBy series "name" "asc" "val" "asc"}}{{#each this}}{{name}} {{/each}}{{/orderBy}}',
          data,
          mockTimeRange
        )
      ).toEqual(wrapped('a3 a4 b2'));
    });

    it('gets the template from the cache if the input data is the same', () => {
      const data = {...mockData};
      const timeRange = {...mockTimeRange};

      // Set the cache so we hit it.
      cache.template = () => 'from the cache';
      cache.lastContent = 'same';
      cache.lastData = data;
      cache.lastTimeRange = timeRange;

      expect(mr.render('same', data, timeRange)).toEqual(wrapped('from the cache'));
    });
  });
});
