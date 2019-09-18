import Remarkable from './vendors/remarkable';
import {dataRule, imageRule, imgSize} from './rules';
import {compileTemplate} from './template';
import {ReportData, TimeRange} from './types';

export class MarkdownRenderer {
  private remarkable: Remarkable;

  public constructor() {
    this.remarkable = new Remarkable('full', {
      html: true,
      linkify: true,
      typographer: true,
    });
    this.remarkable.renderer.rules.image = imageRule;
    this.remarkable.inline.ruler.push('data_rule', dataRule);
    this.remarkable.inline.ruler.push('img_size', imgSize);
  }

  public render(rawContent: string, data: ReportData, timeRange: TimeRange): string {
    const template = compileTemplate(rawContent, data, timeRange);
    const content = template(data);
    return this.remarkable.render(content, {data, timeRange});
  }
}
