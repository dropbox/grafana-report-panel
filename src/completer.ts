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
