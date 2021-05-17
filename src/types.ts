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

export type TimeRange = any; // tslint:disable-line:no-any

export type TimeSeries = any; // tslint:disable-line:no-any

export type RuleState = any; // tslint:disable-line:no-any

export type RemarkableToken = {
  type: string;
  level: number;
  content: string;
};

export type VariableOption = {
  text: string;
  value: string;
  selected: boolean;
};

export type Variable = {
  name: string;
  label: string;
  type: string;
  query: string;
  current: VariableOption;
  options: Array<VariableOption>;
};

export type VariableData = {
  name: string;
  label: string;
  type: string;
  query: string;
  options: Array<VariableOption>;
  current: VariableOption;
  selectedValues: Array<string>;
};

export type ReportData = {
  series: {[key: string]: TimeSeries};
  variables: {[key: string]: VariableData};
  userData?: {[key: string]: any /* JSON */};
};
