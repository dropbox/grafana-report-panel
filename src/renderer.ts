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
