/*
 * Copyright (c) 2019 Dropbox, Inc
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

import {optional, oneOf, ensureString, ensureNumber, safeEval} from '../src/eval';

describe('validators', () => {
  it('can ensureString', () => {
    expect(() => ensureString('foo')).not.toThrow();
    expect(() => ensureString(1)).toThrow();
    expect(() => ensureString({} as any)).toThrow(); // tslint:disable-line:no-any
    expect(() => ensureString([] as any)).toThrow(); // tslint:disable-line:no-any
  });

  it('can ensureNumber', () => {
    expect(() => ensureNumber(1)).not.toThrow();
    expect(() => ensureNumber('foo')).toThrow();
    expect(() => ensureNumber({} as any)).toThrow(); // tslint:disable-line:no-any
    expect(() => ensureNumber([] as any)).toThrow(); // tslint:disable-line:no-any
  });

  it('can support optional validators', () => {
    let foo: any; // tslint:disable-line:no-any
    expect(() => optional(ensureString)(foo)).not.toThrow();
    expect(() => optional(ensureString)('foo')).not.toThrow();
    expect(() => optional(ensureString)(1)).toThrow();
  });

  it('can support oneOf validators', () => {
    expect(() => oneOf(ensureString, ensureNumber)('string')).not.toThrow();
    expect(() => oneOf(ensureString, ensureNumber)(1)).not.toThrow();
    // tslint:disable-next-line:no-any
    expect(() => oneOf(ensureString, ensureNumber)({} as any)).toThrow();
  });
});

describe('safeEval', function() {
  it('should evaluate literals', () => {
    expect(safeEval({}, '1')).toEqual(1);
    expect(safeEval({}, '"foo"')).toEqual('foo');
  });

  it('should be able to do arithmetic', () => {
    expect(safeEval({}, '1 + 2 * 6 / 4')).toEqual(4);
  });

  it('should reject non-whitelisted ops', () => {
    expect(() => safeEval({}, '1 ^ 2')).toThrow(/\^ is not whitelisted/);
  });

  it('should reject non-number arithmetic', () => {
    expect(() => safeEval({}, '1 + "hi"')).toThrow(/argument 2 to \+ is ill-typed: not a number/);
  });

  it('should reject indirect functions', () => {
    const env = {functions: {id: {argValidators: [], impl: () => {}}}};
    expect(() => safeEval(env, '1()')).toThrow(/functions may only be called by name/);
    expect(() => safeEval(env, 'id()()')).toThrow(/functions may only be called by name/);
  });

  it('should reject complicated literals', () => {
    expect(() => safeEval({}, '({a: 1})')).toThrow(/unsupported syntax: ObjectExpression/);
    expect(() => safeEval({}, '[]')).toThrow(/unsupported syntax: ArrayExpression/);
  });

  it('should reject member access', () => {
    expect(() => safeEval({}, 'a.b')).toThrow(/unsupported syntax: MemberExpression/);
    expect(() => safeEval({}, 'a[0]')).toThrow(/unsupported syntax: MemberExpression/);
  });
});
