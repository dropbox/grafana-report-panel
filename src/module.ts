///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
// TODO(blink): We can probably get rid of the above if we add grafana-sdk-mocks to //npm and
// then include it as a dependency in the relevant BUILD targets.

import _ from 'lodash';
import TimeSeries from 'app/core/time_series2';
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import {Completer} from './completer';
import {EXAMPLE_CONTENT, EXAMPLE_USER_DATA, REPORT_STYLING, THEME} from './constants';
import {MarkdownRenderer} from './renderer';
import {ReportData, Variable, VariableData} from './types';

export type TimeSeries = any; // tslint:disable-line:no-any

export class ReportPanelCtrl extends MetricsPanelCtrl {
  public static templateUrl = 'module.html';
  public static scrollable = true;

  // Set and populate defaults
  public panelDefaults = {
    theme: THEME.Light,
    content: EXAMPLE_CONTENT,
    userDataStr: EXAMPLE_USER_DATA,
  };

  private renderer: MarkdownRenderer;
  private content: string;
  private data: ReportData = {series: {}, variables: {}};
  private hasReceivedData: boolean = false;

  /** @ngInject */
  constructor($scope, $injector, templateSrv, private $sce) {
    super($scope, $injector);

    _.defaults(this.panel, this.panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));

    $scope.$watch(
      'ctrl.panel.theme',
      _.throttle(() => {
        this.render();
      }, 1000)
    );

    $scope.$watch(
      'ctrl.panel.content',
      _.debounce(() => {
        this.render();
      }, 1000)
    );

    $scope.$watch(
      'ctrl.panel.userDataStr',
      _.debounce(() => {
        this.render();
      }, 1000)
    );
  }

  public onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/report/editor.html');
    this.addEditorTab('Help', 'public/plugins/report/help.html');
    this.editorTabIndex = 1;
  }

  public onRefresh() {
    this.render();
  }

  public onRender() {
    this.renderMarkdown(this.panel.content, this.panel.userDataStr);
    this.renderingCompleted();
    if (this.hasReceivedData) {
      window.dispatchEvent(new Event("reportrendered"));
    }
  }

  public onDataError(err) {
    this.onDataReceived([]);
  }

  // tslint:disable-next-line:no-any
  public onDataReceived(dataList: any[]) {
    const data: ReportData = {series: {}, variables: {}};

    // Get each series and map by alias.
    dataList.forEach(val => {
      const series = this.createSeriesData(val);
      data.series[series.alias] = series;
    });

    // Get each template variable and map by name.
    this.templateSrv.variables.forEach(variable => {
      data.variables[variable.name] = this.createVariableData(variable);
    });

    this.data = data;
    this.hasReceivedData = true;
    this.onRender();
  }

  private createSeriesData(seriesData): TimeSeries {
    const series = new TimeSeries({
      datapoints: seriesData.datapoints || [],
      alias: seriesData.target,
    });
    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  private createVariableData(variable: Variable): VariableData {
    const selectedValues =
      variable.current.value === '$__all'
        ? variable.options.map(option => option.value).filter(value => value !== '$__all')
        : [variable.current.value];

    return {
      name: variable.name,
      label: variable.label || variable.name,
      type: variable.type,
      query: variable.query,
      options: variable.options,
      current: variable.current,
      selectedValues: selectedValues,
    };
  }

  public getCompleter(): Completer {
    return new Completer();
  }

  public getThemes(): Array<THEME> {
    return [THEME.Light, THEME.Dark];
  }

  public getDataJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  private renderMarkdown(content: string, userDataStr: string) {
    if (!this.renderer) {
      this.renderer = new MarkdownRenderer();
    }

    let userData: any;
    try {
      userData = JSON.parse(userDataStr);
    } catch (error) {
      userData = {error};
    }

    this.$scope.$applyAsync(() => {
      this.updateContent(this.renderer.render(content, {...this.data, userData}, this.timeSrv.timeRange()));
    });
  }

  private updateContent(html: string) {
    try {
      const fullHtml = this.templateSrv.replace(html, this.panel.scopedVars);
      const iframe = document.createElement('iframe');
      iframe.classList.add('rendered-markdown-container');
      iframe.width = iframe.height = '100%';
      iframe.frameBorder = '0';
      iframe.setAttribute('sandbox', ''); // Typed as readonly so cannot directly set.
      iframe.srcdoc = `
        <html>
          <head>
            ${REPORT_STYLING}
          </head>
          <body class="theme-${this.panel.theme}">
            ${fullHtml}
          </body>
        </html>`;
      this.content = this.$sce.trustAsHtml(iframe.outerHTML);
    } catch (e) {
      this.content = this.$sce.trustAsHtml(html);
    }
  }
}

export {ReportPanelCtrl as PanelCtrl};
