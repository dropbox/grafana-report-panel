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

import Esprima = require('./vendors/esprima.js');

export interface ArgValidator {
  (arg: string | number): void;
  optional?: boolean;
}

export interface TypedFunction {
  impl: (...args: any[]) => any; // tslint:disable-line:no-any
  argValidators: ArgValidator[];
}

export interface OperationFunction extends TypedFunction {
  impl: (x: number, y: number) => number | boolean;
}

export class TypeError extends Error {}

export const optional = (validator: ArgValidator): ArgValidator => {
  const opt = x => {
    if (typeof x !== 'undefined') {
      validator(x);
    }
  };
  opt.optional = true;
  return opt;
};

export const oneOf = (...validators: ArgValidator[]): ArgValidator => {
  return x => {
    let errs: string[] = [];
    validators.forEach(validator => {
      try {
        validator(x);
      } catch (err) {
        errs.push(err);
      }
    });
    if (errs.length === validators.length) {
      throw `not one of (${errs.join(',')})`;
    }
  };
};

export const ensureNumber: ArgValidator = x => {
  if (typeof x !== 'number') {
    throw 'not a number';
  }
};

export const ensureString: ArgValidator = x => {
  if (typeof x !== 'string') {
    throw 'not a string';
  }
};

export interface EvalEnv<DataShape> {
  functions?: {[name: string]: TypedFunction};
  data?: DataShape;
}

const BINARY_OPS: {[op: string]: OperationFunction} = {
  '+': {argValidators: [ensureNumber, ensureNumber], impl: (x, y) => x + y},
  '-': {argValidators: [ensureNumber, ensureNumber], impl: (x, y) => x - y},
  '*': {argValidators: [ensureNumber, ensureNumber], impl: (x, y) => x * y},
  '/': {argValidators: [ensureNumber, ensureNumber], impl: (x, y) => x / y},
  '**': {argValidators: [ensureNumber, ensureNumber], impl: (x, y) => x ** y},
  '<': {argValidators: [ensureNumber, ensureNumber], impl: (x, y) => x < y},
  '<=': {argValidators: [ensureNumber, ensureNumber], impl: (x, y) => x <= y},
  // tslint:disable-next-line:triple-equals
  '==': {argValidators: [() => {}, () => {}], impl: (x, y) => x == y},
  // tslint:disable-next-line:triple-equals
  '!=': {argValidators: [() => {}, () => {}], impl: (x, y) => x != y},
  '>=': {argValidators: [ensureNumber, ensureNumber], impl: (x, y) => x >= y},
  '>': {argValidators: [ensureNumber, ensureNumber], impl: (x, y) => x > y},
};

// tslint:disable-next-line:no-any
export function callTypedFunction(funcName: string, func: TypedFunction, args: any[]): any {
  if (args.length < func.argValidators.filter(v => !v.optional).length) {
    throw new TypeError(`${func} expects ${func.argValidators.length} args, got ${args.length}`);
  }
  func.argValidators.forEach((validate, i) => {
    try {
      validate(args[i]);
    } catch (e) {
      throw new TypeError(`argument ${i + 1} to ${funcName} is ill-typed: ${e}`);
    }
  });
  return func.impl(...args.slice(0, func.argValidators.length));
}

// tslint:disable-next-line:no-any
export function safeEvalAST<DataShape>(env: EvalEnv<DataShape>, ast: any): any {
  switch (ast.type) {
    case 'BinaryExpression':
      const op = BINARY_OPS[ast.operator];
      if (!op) {
        throw new SyntaxError(`binary op ${ast.operator} is not whitelisted`);
      }

      const left = safeEvalAST(env, ast.left);
      const right = safeEvalAST(env, ast.right);
      return callTypedFunction(ast.operator, op, [left, right]);

    case 'CallExpression':
      if (ast.callee.type !== 'Identifier') {
        throw new SyntaxError(
          `functions may only be called by name; got ${JSON.stringify(ast.callee)}`
        );
      }
      if (!(env.functions && env.functions.hasOwnProperty(ast.callee.name))) {
        throw new ReferenceError(`no function named ${ast.callee.name}`);
      }
      const func = env.functions[ast.callee.name];
      const args = ast.arguments.map(x => safeEvalAST(env, x));
      return callTypedFunction(ast.callee.name, func, args);

    case 'Literal':
      const type = typeof ast.value;
      if (!(type === 'string' || type === 'number')) {
        throw new TypeError(`refusing to touch literal of type ${type}`);
      }
      return ast.value;

    case 'ConditionalExpression':
      return safeEvalAST(env, ast.test)
        ? safeEvalAST(env, ast.consequent)
        : safeEvalAST(env, ast.alternate);

    case 'TemplateLiteral':
      let result = ast.quasis[0].value.raw;
      for (let i = 0; i < ast.expressions.length; i++) {
        result += safeEvalAST(env, ast.expressions[i]).toString();
        result += ast.quasis[i + 1].value.raw;
      }
      return result;
  }

  throw new SyntaxError(`unsupported syntax: ${ast.type}`);
}

// tslint:disable-next-line:no-any
export function safeEval<DataShape>(env: EvalEnv<DataShape>, s: string): any {
  const {
    body: [{expression: ast}],
  } = Esprima.parseScript(s);
  return safeEvalAST(env, ast);
}
