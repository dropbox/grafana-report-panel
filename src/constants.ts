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

export const enum THEME {
  Light = 'light',
  Dark = 'dark',
}

export const EXAMPLE_CONTENT = `# Report Panel

Panels are parsed as Markdown and support two types of variable interpolation:

- Inline evaluation with the following syntax: '$[<safe js code here>]' .
- Handlebars with several helpers for evaluating values.

## Sample Markdown (with inline $[] eval syntax)

| Series | Max | Min |
  ------ | --- | ---
  A-series | $[thresholdStyles(max("A-series"), 2, 'red', 50, 'gray', 80, 'green')] |  $[thresholdStyles(min("A-series"), 2, 'red', 50, 'gray', 80, 'green')]


## Sample HTML

<table>
  <thead>
    <tr>
      <th>Series</th>
      <th>Max</th>
      <th>Min</th>
      <th>Diff</th>
    </tr>
  </thead>
  <tbody>
    {{#each series}}
      <tr>
        <td>{{@key}}</td>
        <td>
          {{#eval}}
            thresholdStyles(min("{{@key}}"), 2, 'red', 50, 'gray', 80, 'green')
          {{/eval}}
        </td>
        <td>
          {{#max @key as |maxValue|}}
            {{thresholdStyles maxValue 2 'red' 50 'gray' 80 'green'}}
          {{/max}}
        </td>
        <td>
          {{#eval}}
            toFixed(max("{{@key}}") - min("{{@key}}"), 2)
          {{/eval}}
        </td>
      </tr>
    {{/each}}
  </tbody>
</table>


## Using custom user data

{{#each userData.metricsToList}}
- [{{name}}]({{link}}) -- currently {{#eval}} current("{{name}}") {{/eval}}
{{/each}}
`;

export const EXAMPLE_USER_DATA = JSON.stringify(
  {
    "metricsToList": [
      {"name": "A-series", "link": "http://example.com/A-series"},
      {"name": "B-series", "link": "http://example.com/B-series"},
      {"name": "C-series", "link": "http://example.com/C-series"}
    ]
  },
  null,
  2
);

/* Most of this styling is copy-pasted from the computed styles for a Markdown table in Grafana.
 * Since the report is sandboxed in an iframe, Grafana's styles don't apply to it --
 * so we steal the ones we want.
 */
export const REPORT_STYLING = `<style>
body {
  bottom: 0px;
  display: block;
  left: 0px;
  position: absolute;
  right: 0px;
  top: 0px;
  font-family: Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 13px;
}

h1, h2, h3 { font-weight: 400; }

a       { text-decoration: none !important; }
.bold   { font-weight: 900; }
.italic { font-style: italic; }
.green  { color: green; }
.yellow { color: yellow; }
.orange { color: orange; }
.red    { color: red; }
.gray   { color: gray; }

table {
  border-style: solid;
  border-width: 1px;
  border-collapse: collapse;
  display: table;
}

thead {
  border-collapse: collapse;
  display: table-header-group;
  vertical-align: middle;
}

th {
  border-style: solid;
  border-width: 1px;
  border-collapse: collapse;
  display: table-cell;
  padding-bottom: 7px;
  padding-left: 14px;
  padding-right: 14px;
  padding-top: 7px;
  vertical-align: middle;
  font-weight: 400;
}

thead > tr {
  border-collapse: collapse;
  display: table-row;
  vertical-align: middle;
}

tbody {
  border-collapse: collapse;
  display: table-row-group;
  height: 816px;
  vertical-align: middle;
  width: 581px;
}

tbody > tr {
  border-collapse: collapse;
  display: table-row;
  vertical-align: middle;
}

td {
  border-style: solid;
  border-width: 1px;
  border-collapse: collapse;
  display: table-cell;
  padding-bottom: 7px;
  padding-left: 14px;
  padding-right: 14px;
  padding-top: 7px;
  vertical-align: middle;
}

/* THEME: light */
.theme-light {
  background-color: rgb(247, 248, 250);
  color: #222;
}
.theme-light a {
  color: #61c2f2;
}
.theme-light table {
  border-color: rgb(172, 182, 191);
}
.theme-light thead {
  border-color: rgb(172, 182, 191);
}
.theme-light th {
  background-color: rgb(221, 228, 237);
  border-color: rgb(172, 182, 191);
}
.theme-light th > tr {
  border-color: rgb(172, 182, 191);
}
.theme-light tbody {
  border-color: rgb(172, 182, 191);
}
.theme-light tbody > tr {
  border-color: rgb(172, 182, 191);
}
.theme-light td {
  border-color: rgb(172, 182, 191);
}
.theme-light tr:nth-child(2n) > td {
  background-color: rgba(221, 228, 237, 0.3);
}

/* THEME: dark */
.theme-dark {
  background-color: transparent;
  color: rgb(216, 217, 218);
}
.theme-dark::-webkit-scrollbar {
  width: 10px;
  background-color: rgba(255, 255, 255, 0.1);
}
.theme-dark::-webkit-scrollbar-track {
  outline: 1px solid rgba(255, 255, 255, 0.3);
}
.theme-dark::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: rgba(255, 255, 255, 0.3);
  outline: 1px solid rgba(255, 255, 255, 0.4);
}
.theme-dark a {
  color: #61c2f2;
}
.theme-dark table {
  border-color: rgba(172, 182, 191, 0.2);
}
.theme-dark thead {
  border-color: rgba(172, 182, 191, 0.2);
}
.theme-dark th {
  background-color: rgba(221, 228, 237, 0.2);
  border-color: rgba(172, 182, 191, 0.2);
}
.theme-dark th > tr {
  border-color: rgba(172, 182, 191, 0.2);
}
.theme-dark tbody {
  border-color: rgba(172, 182, 191, 0.2);
}
.theme-dark tbody > tr {
  border-color: rgba(172, 182, 191, 0.2);
}
.theme-dark td {
  border-color: rgba(172, 182, 191, 0.2);
}
.theme-dark tr:nth-child(2n) > td {
  background-color: rgba(221, 228, 237, 0.08);
}

</style>`;
