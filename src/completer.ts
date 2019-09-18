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

export class Completer {
  private templateVariableCompletions = [
    {
      caption: '$[startDate("<format>")]',
      value: '$[startDate("MM/DD/YYYY")]',
      meta: 'replace',
      score: Number.MAX_VALUE,
    },
    {
      caption: '$[endDate("<format>")]',
      value: '$[endDate("MM/DD/YYYY")]',
      meta: 'replace',
      score: Number.MAX_VALUE,
    },
    {
      caption: '$[max("<metric>", <precision>)]',
      value: '$[max("metric",2)]',
      meta: 'replace',
      score: Number.MAX_VALUE,
    },
  ];

  public getCompletions(
    editor: any, // tslint:disable-line:no-any
    session: any, // tslint:disable-line:no-any
    pos: {row: number; column: number},
    prefix: string,
    callback: Function
  ) {
    callback(null, [...this.templateVariableCompletions]);
  }
}
