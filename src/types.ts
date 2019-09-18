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
