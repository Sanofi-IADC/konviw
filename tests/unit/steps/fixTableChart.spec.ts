import { ConfigService } from '@nestjs/config';
import { Tabletojson } from 'tabletojson';
import { ContextService } from '../../../src/context/context.service';
import fixTableChart, { computeFilterMask, recomputeCategoryCounts } from '../../../src/proxy-page/steps/fixTableChart';
import { createModuleRefForStep } from './utils';

// Stiltsoft joins the selected aggregation columns with U+201A (‚), not a comma.
const SEP = '\u201A';

// jest.fn()-backed so table-processor specs can control/assert Jira calls;
// legacy table-chart specs never exercise these and keep the harmless defaults.
class JiraServiceMock {
  getFields = jest.fn().mockResolvedValue([]);

  findTickets = jest.fn().mockResolvedValue({ data: { issues: [] } });
}

const statusField = (name: string) => ({
  self: '',
  description: '',
  iconUrl: '',
  name,
  id: name,
  statusCategory: {
    self: '', id: 1, key: name.toLowerCase(), colorName: 'green', name,
  },
});

// Builds the storage body for a `table-processor` macro: a `serialized` JSON
// tree (filter root + chart children) plus a Jira smart-link datasource card
// in place of an inline `<table>` (see tableProcessorJira.ts for the shape).
const buildProcessorStorage = ({
  chartParams = [{
    column: 'Status', aggregation: 'Status', type: 'Column', legend: 'right',
  }] as Record<string, string>[],
  filterParams = {} as Record<string, string>,
  datasourceColumns = ['key', 'status'],
  jql = 'project = FND',
  includeDatasource = true,
  includeRichTextBody = true,
  serialized = undefined as string | undefined,
} = {}) => {
  const tree = {
    type: 'filter',
    params: filterParams,
    child: chartParams.map((params) => ({ type: 'chart', params })),
  };
  const serializedJson = serialized ?? JSON.stringify([tree]);
  const datasourceJson = JSON.stringify({
    parameters: { jql },
    views: [{ type: 'table', properties: { columns: datasourceColumns.map((key) => ({ key })) } }],
  });
  let richTextBody = '';
  if (includeRichTextBody) {
    richTextBody = includeDatasource
      ? `<ac:rich-text-body><a data-datasource='${datasourceJson}'>Jira issues</a></ac:rich-text-body>`
      : '<ac:rich-text-body><p>no datasource here</p></ac:rich-text-body>';
  }
  return `<ac:structured-macro ac:name="table-processor" ac:schema-version="1">
    <ac:parameter ac:name="serialized">${serializedJson}</ac:parameter>
    ${richTextBody}
  </ac:structured-macro>`;
};

const processorViewHtml = (count = 1) => `
<html>
  <body>
    <div id="Content">
      ${'<div class="ap-container output-block" data-macro-name="table-processor"><iframe></iframe></div>'.repeat(count)}
    </div>
  </body>
</html>`;

// Some Confluence renditions server-render a table-processor macro's Jira
// search directly into a plain table instead of leaving the empty iframe
// placeholder `processorViewHtml` builds above — no macro id or marker
// survives, just this Confluence-native table class.
const NATIVE_JIRA_TABLE = '<table class="jiraWorkItemMacroListViewTable"><thead><tr><th>Key</th></tr>'
  + '</thead><tbody><tr><td>FND-1</td></tr></tbody></table>';

const processorNativeTableViewHtml = (count = 1) => `
<html>
  <body>
    <div id="Content">
      ${NATIVE_JIRA_TABLE.repeat(count)}
    </div>
  </body>
</html>`;

// The view body Confluence returns for a Connect "Table Filters and Charts"
// macro: only an empty iframe placeholder, no table nor chart.
const viewHtml = `
<html>
  <body>
    <div id="Content">
      <h3>Chart from Table macro</h3>
      <div class="conf-macro output-block ap-container" data-hasbody="true" data-macro-name="table-chart" data-macro-id="eb1c6cf8">
        <iframe class="ap-iframe"></iframe>
      </div>
    </div>
  </body>
</html>`;

// The storage body holds the macro parameters and the source data table.
const storageXml = `
<ac:structured-macro ac:name="table-chart" ac:schema-version="1" ac:macro-id="eb1c6cf8">
  <ac:parameter ac:name="type">Stacked Column</ac:parameter>
  <ac:parameter ac:name="column">Month</ac:parameter>
  <ac:parameter ac:name="aggregation">Not Managed${SEP}MCE${SEP}Central Jira</ac:parameter>
  <ac:parameter ac:name="colors">#2484c1,#f6c342,#d04437</ac:parameter>
  <ac:parameter ac:name="legend">right</ac:parameter>
  <ac:parameter ac:name="hide">true</ac:parameter>
  <ac:rich-text-body>
    <table>
      <tbody>
        <tr><th><p>Month</p></th><th><p>Not Managed</p></th><th><p>MCE</p></th><th><p>Central Jira</p></th></tr>
        <tr><td><p>May</p></td><td><p>2300</p></td><td><p>2900</p></td><td><p>700</p></td></tr>
        <tr><td><p>June</p></td><td><p>2400</p></td><td><p>3000</p></td><td><p>750</p></td></tr>
      </tbody>
    </table>
  </ac:rich-text-body>
</ac:structured-macro>`;

// These two are exported specifically so this exact code — the algorithm
// embedded (via `.toString()`) into the browser-side FILTER_APPLY_SCRIPT —
// can be exercised directly in Node, without a DOM/browser. This is the
// core of the filter-dropdown feature: which issues match the selected
// value, and how the chart re-aggregates them.
describe('ConfluenceProxy / fixTableChart — client-side filter algorithm', () => {
  describe('computeFilterMask', () => {
    it('matches everything when nothing is selected ("All")', () => {
      expect(computeFilterMask(['A', 'B', 'A'], '')).toEqual([true, true, true]);
    });

    it('matches only entries equal to the selected value', () => {
      expect(computeFilterMask(['A', 'B', 'A', 'C'], 'A')).toEqual([true, false, true, false]);
    });

    it('matches nothing when the selected value is not present', () => {
      expect(computeFilterMask(['A', 'B'], 'Z')).toEqual([false, false]);
    });

    it('returns an empty mask for an empty values list', () => {
      expect(computeFilterMask([], 'A')).toEqual([]);
    });
  });

  describe('recomputeCategoryCounts', () => {
    it('counts only the masked-in entries, preserving first-seen order', () => {
      const categories = ['Open', 'Done', 'Open', 'Done', 'Open'];
      const mask = [true, true, false, true, true];
      expect(recomputeCategoryCounts(categories, mask)).toEqual({
        order: ['Open', 'Done'],
        counts: { Open: 2, Done: 2 },
      });
    });

    it('returns an empty result when the mask excludes every entry', () => {
      expect(recomputeCategoryCounts(['Open', 'Done'], [false, false])).toEqual({
        order: [],
        counts: {},
      });
    });

    it('matches aggregateByCategory\'s server-side grouping for the unfiltered (all-true) mask', () => {
      const categories = ['Done', 'Open', 'Done', 'Done', 'Open'];
      const mask = categories.map(() => true);
      expect(recomputeCategoryCounts(categories, mask)).toEqual({
        order: ['Done', 'Open'],
        counts: { Done: 3, Open: 2 },
      });
    });
  });
});

describe('ConfluenceProxy / fixTableChart', () => {
  let context: ContextService;
  let config: ConfigService;
  let jiraService: JiraServiceMock;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    jiraService = new JiraServiceMock();
    context.initPageContext('v2', 'XXX', '60616441914', 'dark');
  });

  const runStep = async () => fixTableChart(config, jiraService as any)(context);

  describe('Chart from Table (hidden source table)', () => {
    beforeEach(async () => {
      context.setHtmlBody(viewHtml);
      context.setBodyStorage(storageXml);
      await runStep();
    });

    it('replaces the placeholder iframe with an ApexCharts container', () => {
      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(1);
      expect($('iframe.ap-iframe').length).toBe(0);
    });

    it('builds a stacked bar chart with a series per aggregation column', () => {
      const html = context.getHtmlBody();
      expect(html).toContain("type: 'bar'");
      expect(html).toContain('stacked: true');
      expect(html).toContain('"name":"Not Managed"');
      expect(html).toContain('"name":"MCE"');
      expect(html).toContain('"name":"Central Jira"');
      expect(html).toContain('"data":[2300,2400]');
    });

    it('uses the configured categories, colors and legend position', () => {
      const html = context.getHtmlBody();
      expect(html).toContain('categories: ["May","June"]');
      expect(html).toContain('#2484c1');
      expect(html).toContain("position: 'right'");
    });

    it('loads the ApexCharts library once', () => {
      const $ = context.getCheerioBody();
      expect($('script[data-konviw-apexcharts]').length).toBe(1);
    });

    it('hides the source table when hide=true', () => {
      const $ = context.getCheerioBody();
      expect($('table.confluenceTable').length).toBe(0);
    });
  });

  describe('Chart from Table (visible source table)', () => {
    it('wraps the chart and the source table in a Chart/Table tab toggle instead of stacking them when hide!=true', async () => {
      const storageVisible = storageXml.replace(
        '<ac:parameter ac:name="hide">true</ac:parameter>',
        '<ac:parameter ac:name="hide">false</ac:parameter>',
      );
      context.setHtmlBody(viewHtml);
      context.setBodyStorage(storageVisible);
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-tablechart-group').length).toBe(1);
      expect($('.konviw-tablechart-tab').length).toBe(2);
      expect($('.konviw-tablechart-tab').eq(0).text()).toBe('Chart');
      expect($('.konviw-tablechart-tab').eq(1).text()).toBe('Table');
      expect($('.konviw-tablechart-tab.is-active').length).toBe(1);
      expect($('.konviw-tablechart-tab.is-active').text()).toBe('Chart');
      expect($('.konviw-table-chart').length).toBe(1);
      expect($('table.confluenceTable').length).toBe(1);
      expect($('table.confluenceTable').text()).toContain('May');
      expect($('script[data-konviw-tablechart-toggle]').length).toBe(1);
    });

    it('does not wrap in tabs when the chart has no table to switch to (hide=true)', async () => {
      context.setHtmlBody(viewHtml);
      context.setBodyStorage(storageXml);
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-tablechart-group').length).toBe(0);
      expect($('.konviw-table-chart').length).toBe(1);
      expect($('table.confluenceTable').length).toBe(0);
      expect($('script[data-konviw-tablechart-toggle]').length).toBe(0);
    });
  });

  describe('Pie chart', () => {
    it('emits labels and a flat series array for a pie chart', async () => {
      const pieStorage = `
        <ac:structured-macro ac:name="table-chart" ac:schema-version="1">
          <ac:parameter ac:name="type">Pie</ac:parameter>
          <ac:parameter ac:name="column">Instances</ac:parameter>
          <ac:parameter ac:name="aggregation">Users</ac:parameter>
          <ac:parameter ac:name="hide">true</ac:parameter>
          <ac:rich-text-body>
            <table>
              <tbody>
                <tr><th><p>Instances</p></th><th><p>Users</p></th></tr>
                <tr><td><p>Not Managed</p></td><td><p>1500</p></td></tr>
                <tr><td><p>MCE</p></td><td><p>2900</p></td></tr>
                <tr><td><p>Central Jira</p></td><td><p>900</p></td></tr>
              </tbody>
            </table>
          </ac:rich-text-body>
        </ac:structured-macro>`;
      context.setHtmlBody(viewHtml);
      context.setBodyStorage(pieStorage);
      await runStep();

      const html = context.getHtmlBody();
      expect(html).toContain("type: 'pie'");
      expect(html).toContain('series: [1500,2900,900]');
      expect(html).toContain('labels: ["Not Managed","MCE","Central Jira"]');
    });
  });

  describe('Table Filter / Pivot Table variants (no chart type)', () => {
    it('renders the plain source table when the macro has no type', async () => {
      const filterStorage = `
        <ac:structured-macro ac:name="table-chart" ac:schema-version="1">
          <ac:parameter ac:name="column">Month</ac:parameter>
          <ac:rich-text-body>
            <table>
              <tbody>
                <tr><th><p>Month</p></th><th><p>Value</p></th></tr>
                <tr><td><p>May</p></td><td><p>2300</p></td></tr>
              </tbody>
            </table>
          </ac:rich-text-body>
        </ac:structured-macro>`;
      context.setHtmlBody(viewHtml);
      context.setBodyStorage(filterStorage);
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(0);
      expect($('table.confluenceTable').length).toBe(1);
      expect($('table.confluenceTable').text()).toContain('2300');
      expect($('script[data-konviw-apexcharts]').length).toBe(0);
    });
  });

  describe('Multiple macros correlated by document order', () => {
    it('matches each placeholder with the storage macro at the same index', async () => {
      const twoPlaceholders = `
        <html><body><div id="Content">
          <div data-macro-name="table-chart"><iframe></iframe></div>
          <p></p>
          <div data-macro-name="table-chart"><iframe></iframe></div>
        </div></body></html>`;
      const twoMacros = `
        <ac:structured-macro ac:name="table-chart">
          <ac:parameter ac:name="type">Column</ac:parameter>
          <ac:parameter ac:name="column">Month</ac:parameter>
          <ac:parameter ac:name="aggregation">Value</ac:parameter>
          <ac:parameter ac:name="hide">true</ac:parameter>
          <ac:rich-text-body><table><tbody>
            <tr><th><p>Month</p></th><th><p>Value</p></th></tr>
            <tr><td><p>May</p></td><td><p>11</p></td></tr>
          </tbody></table></ac:rich-text-body>
        </ac:structured-macro>
        <ac:structured-macro ac:name="table-chart">
          <ac:parameter ac:name="type">Pie</ac:parameter>
          <ac:parameter ac:name="column">City</ac:parameter>
          <ac:parameter ac:name="aggregation">Sales</ac:parameter>
          <ac:parameter ac:name="hide">true</ac:parameter>
          <ac:rich-text-body><table><tbody>
            <tr><th><p>City</p></th><th><p>Sales</p></th></tr>
            <tr><td><p>Paris</p></td><td><p>42</p></td></tr>
          </tbody></table></ac:rich-text-body>
        </ac:structured-macro>`;
      context.setHtmlBody(twoPlaceholders);
      context.setBodyStorage(twoMacros);
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(2);
      const html = context.getHtmlBody();
      expect(html).toContain("type: 'bar'");
      expect(html).toContain("type: 'pie'");
    });
  });

  describe('No placeholders present', () => {
    it('does nothing when the page has no table-chart macros', async () => {
      const plain = '<html><body><div id="Content"><p>hello</p></div></body></html>';
      context.setHtmlBody(plain);
      context.setBodyStorage('');
      await runStep();
      expect(context.getHtmlBody()).toContain('hello');
      expect(context.getCheerioBody()('script[data-konviw-apexcharts]').length).toBe(0);
    });
  });

  // Helper to render a single chart macro of a given type and return the
  // generated HTML (including the ApexCharts options script).
  const renderChart = async (type: string, extraParams = '', tableRows = ''): Promise<string> => {
    const rows = tableRows
      || `<tr><th><p>Month</p></th><th><p>Not Managed</p></th><th><p>MCE</p></th></tr>
          <tr><td><p>May</p></td><td><p>2300</p></td><td><p>2900</p></td></tr>
          <tr><td><p>June</p></td><td><p>2400</p></td><td><p>3000</p></td></tr>`;
    const storage = `
      <ac:structured-macro ac:name="table-chart">
        <ac:parameter ac:name="type">${type}</ac:parameter>
        <ac:parameter ac:name="column">Month</ac:parameter>
        <ac:parameter ac:name="hide">true</ac:parameter>
        ${extraParams}
        <ac:rich-text-body><table><tbody>${rows}</tbody></table></ac:rich-text-body>
      </ac:structured-macro>`;
    context.setHtmlBody(viewHtml);
    context.setBodyStorage(storage);
    await runStep();
    return context.getHtmlBody();
  };

  describe('Data labels (WEB-2452 values on bars)', () => {
    it('enables data labels for bar/column charts', async () => {
      expect(await renderChart('Column')).toContain('enabled: true');
    });

    it('uses a readable dark label color with a background pill', async () => {
      const html = await renderChart('Column');
      expect(html).toContain("colors: ['#172b4d']");
      expect(html).toContain('background: { enabled: true');
    });

    it('blanks out zero values so empty categories show no label', async () => {
      const html = await renderChart('Column');
      expect(html).toContain("return val === 0 ? '' : String(val);");
    });

    it('disables data labels for line charts to avoid clutter', async () => {
      expect(await renderChart('Line')).toContain('enabled: false');
    });

    it('enables data labels for pie charts', async () => {
      const html = await renderChart(
        'Pie',
        '',
        `<tr><th><p>Month</p></th><th><p>Not Managed</p></th></tr>
         <tr><td><p>May</p></td><td><p>2300</p></td></tr>`,
      );
      expect(html).toContain("type: 'pie'");
      expect(html).toContain('enabled: true');
    });
  });

  describe('Chart type mapping', () => {
    it('renders "Bar" as a horizontal bar chart', async () => {
      const html = await renderChart('Bar');
      expect(html).toContain("type: 'bar'");
      expect(html).toContain('horizontal: true');
    });

    it('renders "Column" as a vertical (non-horizontal) bar chart', async () => {
      const html = await renderChart('Column');
      expect(html).toContain("type: 'bar'");
      expect(html).toContain('horizontal: false');
      expect(html).toContain('stacked: false');
    });

    it('renders "Stacked Bar" as a horizontal stacked bar chart', async () => {
      const html = await renderChart('Stacked Bar');
      expect(html).toContain('horizontal: true');
      expect(html).toContain('stacked: true');
    });

    it('renders "Area" as an area chart', async () => {
      expect(await renderChart('Area')).toContain("type: 'area'");
    });

    it('renders "Donut" as a donut chart', async () => {
      const html = await renderChart(
        'Donut',
        '',
        `<tr><th><p>Month</p></th><th><p>Value</p></th></tr>
         <tr><td><p>May</p></td><td><p>2300</p></td></tr>`,
      );
      expect(html).toContain("type: 'donut'");
    });

    it('defaults an unknown type to a vertical bar chart', async () => {
      const html = await renderChart('SomethingWeird');
      expect(html).toContain("type: 'bar'");
      expect(html).toContain('horizontal: false');
    });
  });

  describe('Legend option', () => {
    it('hides the legend when legend=false', async () => {
      const html = await renderChart('Column', '<ac:parameter ac:name="legend">false</ac:parameter>');
      expect(html).toContain('legend: { show: false }');
    });

    it('positions the legend when a valid position is given', async () => {
      const html = await renderChart('Column', '<ac:parameter ac:name="legend">top</ac:parameter>');
      expect(html).toContain("position: 'top'");
    });

    it('falls back to a bottom legend for an unknown position value', async () => {
      const html = await renderChart('Column', '<ac:parameter ac:name="legend">weird</ac:parameter>');
      expect(html).toContain("position: 'bottom'");
    });
  });

  describe('Title option', () => {
    it('adds a chart title when the title parameter is set', async () => {
      const html = await renderChart('Column', '<ac:parameter ac:name="title">My chart</ac:parameter>');
      expect(html).toContain('title: { text: "My chart"');
    });

    it('omits the title block when no title parameter is set', async () => {
      expect(await renderChart('Column')).not.toContain('title: { text:');
    });
  });

  describe('Aggregation separator entity decoding (real storage regression)', () => {
    // In the real body.storage the aggregation/pieKeys separator is stored as
    // the HTML entity &sbquo; (U+201A), which cheerio's XML mode does NOT decode.
    // The columns must still be split and kept in the configured order.
    const stackedStorage = `
      <ac:structured-macro ac:name="table-chart" ac:schema-version="1">
        <ac:parameter ac:name="type">Stacked Column</ac:parameter>
        <ac:parameter ac:name="column">Month</ac:parameter>
        <ac:parameter ac:name="aggregation">MCE&sbquo;Not Managed&sbquo;Central Jira</ac:parameter>
        <ac:parameter ac:name="colors">#2484c1,#f6c342,#d04437</ac:parameter>
        <ac:parameter ac:name="hide">true</ac:parameter>
        <ac:rich-text-body>
          <table>
            <tbody>
              <tr><th><p>Month</p></th><th><p>Not Managed</p></th><th><p>MCE</p></th><th><p>Central Jira</p></th></tr>
              <tr><td><p>May</p></td><td><p>2300</p></td><td><p>2900</p></td><td><p>700</p></td></tr>
            </tbody>
          </table>
        </ac:rich-text-body>
      </ac:structured-macro>`;

    it('splits the &sbquo; aggregation into the configured series order', async () => {
      context.setHtmlBody(viewHtml);
      context.setBodyStorage(stackedStorage);
      await runStep();

      const html = context.getHtmlBody();
      expect(html).toContain(
        'series: [{"name":"MCE","data":[2900]},{"name":"Not Managed","data":[2300]},{"name":"Central Jira","data":[700]}]',
      );
    });
  });

  describe('Numeric parsing', () => {
    it('strips thousands separators and spaces from numeric cells', async () => {
      const html = await renderChart(
        'Column',
        '<ac:parameter ac:name="aggregation">Value</ac:parameter>',
        `<tr><th><p>Month</p></th><th><p>Value</p></th></tr>
         <tr><td><p>May</p></td><td><p>2,300</p></td></tr>
         <tr><td><p>June</p></td><td><p>1 500</p></td></tr>`,
      );
      expect(html).toContain('"data":[2300,1500]');
    });

    it('treats a non-numeric cell as 0', async () => {
      const html = await renderChart(
        'Column',
        '<ac:parameter ac:name="aggregation">Value</ac:parameter>',
        `<tr><th><p>Month</p></th><th><p>Value</p></th></tr>
         <tr><td><p>May</p></td><td><p>N/A</p></td></tr>`,
      );
      expect(html).toContain('"data":[0]');
    });
  });

  describe('buildChart edge cases (no usable data)', () => {
    it('falls back to the (empty) source table when the macro has a type but no rows', async () => {
      const noRowsStorage = `
        <ac:structured-macro ac:name="table-chart">
          <ac:parameter ac:name="type">Column</ac:parameter>
          <ac:parameter ac:name="column">Month</ac:parameter>
          <ac:rich-text-body><table><tbody></tbody></table></ac:rich-text-body>
        </ac:structured-macro>`;
      context.setHtmlBody(viewHtml);
      context.setBodyStorage(noRowsStorage);
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(0);
      expect($('script[data-konviw-apexcharts]').length).toBe(0);
    });

    it('falls back to the plain table when the source table has fewer than 2 columns', async () => {
      const singleColumnStorage = `
        <ac:structured-macro ac:name="table-chart">
          <ac:parameter ac:name="type">Column</ac:parameter>
          <ac:parameter ac:name="column">Month</ac:parameter>
          <ac:rich-text-body><table><tbody>
            <tr><th><p>Month</p></th></tr>
            <tr><td><p>May</p></td></tr>
          </tbody></table></ac:rich-text-body>
        </ac:structured-macro>`;
      context.setHtmlBody(viewHtml);
      context.setBodyStorage(singleColumnStorage);
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(0);
      expect($('table.confluenceTable').text()).toContain('May');
    });

    it('defaults to the first column when the configured category column is not one of the table headers', async () => {
      const html = await renderChart(
        'Column',
        '<ac:parameter ac:name="column">NotAColumn</ac:parameter><ac:parameter ac:name="aggregation">MCE</ac:parameter>',
      );
      // "Month" (the first/actual header) is used as the category axis instead
      // of the non-existent configured "NotAColumn".
      expect(html).toContain('categories: ["May","June"]');
    });
  });

  describe('table-processor (Jira-backed) macros', () => {
    beforeEach(() => {
      jiraService.getFields.mockResolvedValue([
        { id: 'status', name: 'Status', schema: { type: 'status' } },
      ]);
      jiraService.findTickets.mockResolvedValue({
        data: {
          issues: [
            { key: 'FND-1', fields: { status: statusField('Done') } },
            { key: 'FND-2', fields: { status: statusField('Open') } },
            { key: 'FND-3', fields: { status: statusField('Done') } },
          ],
        },
      });
    });

    it('renders an ApexCharts chart aggregated by category and a Grid.js table from live Jira data', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage());
      await runStep();

      expect(jiraService.getFields).toHaveBeenCalledTimes(1);
      expect(jiraService.findTickets).toHaveBeenCalledWith(
        'System JIRA',
        'project = FND',
        expect.stringContaining('status'),
      );

      const html = context.getHtmlBody();
      expect(html).toContain('konviw-table-chart-jira-0-0');
      expect(html).toContain('series: [{"name":"Status","data":[2,1]}]');
      expect(html).toContain('xaxis: { categories: ["Done","Open"] },');
      expect(html).toContain('id="gridjstp-0"');

      const $ = context.getCheerioBody();
      expect($('[data-macro-name="table-processor"]').length).toBe(0);
      expect($('script[data-konviw-apexcharts]').length).toBe(1);
      expect($('script[src*="gridjs.production.min.js"]').length).toBe(1);

      // The chart and its table are offered as a Chart/Table toggle, not
      // stacked, so the reader picks one.
      expect($('.konviw-tablechart-group').length).toBe(1);
      expect($('.konviw-tablechart-tab').length).toBe(2);
      expect($('.konviw-tablechart-tab').eq(0).text()).toBe('Chart');
      expect($('.konviw-tablechart-tab').eq(1).text()).toBe('Table');
      expect($('.konviw-tablechart-panel.is-active').length).toBe(1);
      expect($('script[data-konviw-tablechart-toggle]').length).toBe(1);
    });

    it('does not re-inject the ApexCharts/Grid.js assets when they are already present', async () => {
      context.setHtmlBody(`
        <html><head>
          <link href="/gridjs/mermaid.min.css" rel="stylesheet" />
        </head><body>
          <script data-konviw-apexcharts src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
          <script src="/gridjs/gridjs.production.min.js"></script>
          <div id="Content">${processorViewHtml().replace(/<\/?html>|<\/?body>/g, '')}</div>
        </body></html>`);
      context.setBodyStorage(buildProcessorStorage());
      await runStep();

      const $ = context.getCheerioBody();
      expect($('script[data-konviw-apexcharts]').length).toBe(1);
      expect($('script[src*="gridjs.production.min.js"]').length).toBe(1);
    });

    it('renders every chart node found in the serialized tree, each with a unique id', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({
        chartParams: [
          { column: 'Status', aggregation: 'Status', type: 'Column' },
          { column: 'Status', aggregation: 'Status', type: 'Pie' },
        ],
      }));
      await runStep();

      const html = context.getHtmlBody();
      expect(html).toContain('konviw-table-chart-jira-0-0');
      expect(html).toContain('konviw-table-chart-jira-0-1');
      expect(html).toContain("type: 'bar'");
      expect(html).toContain("type: 'pie'");

      // Three views to choose from (two numbered charts + the table).
      const $ = context.getCheerioBody();
      expect($('.konviw-tablechart-tab').length).toBe(3);
      expect($('.konviw-tablechart-tab').eq(0).text()).toBe('Chart 1');
      expect($('.konviw-tablechart-tab').eq(1).text()).toBe('Chart 2');
      expect($('.konviw-tablechart-tab').eq(2).text()).toBe('Table');
    });

    it('falls back to a table-only rendering (no tabs) when the tree has no chart node', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({ chartParams: [] }));
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(0);
      expect($('script[data-konviw-apexcharts]').length).toBe(0);
      expect($('script[src*="gridjs.production.min.js"]').length).toBe(1);
      expect(context.getHtmlBody()).toContain('id="gridjstp-0"');
      expect($('.konviw-tablechart-group').length).toBe(0);
      expect($('script[data-konviw-tablechart-toggle]').length).toBe(0);
    });

    it('falls back to a table-only rendering when the serialized JSON is malformed', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({ serialized: '{not valid json' }));
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(0);
      expect(context.getHtmlBody()).toContain('id="gridjstp-0"');
    });

    it('skips a chart whose column label does not resolve to a known Jira field, but still renders the table', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({
        chartParams: [{ column: 'Not A Real Field', aggregation: 'Not A Real Field', type: 'Column' }],
      }));
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(0);
      expect(context.getHtmlBody()).toContain('id="gridjstp-0"');
    });

    it('removes a placeholder outright when its macro has no parseable Jira datasource', async () => {
      context.setHtmlBody(processorViewHtml(2));
      const withDatasource = buildProcessorStorage();
      const withoutDatasource = buildProcessorStorage({ includeDatasource: false });
      context.setBodyStorage(withDatasource + withoutDatasource);
      await runStep();

      const $ = context.getCheerioBody();
      expect($('[data-macro-name="table-processor"]').length).toBe(0);
      expect($('.konviw-table-chart').length).toBe(1);
      expect($('div[id^="gridjstp-"]').length).toBe(1);
    });

    it('removes a placeholder with no matching storage macro (index mismatch) without calling Jira', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage('');
      await runStep();

      expect(jiraService.getFields).not.toHaveBeenCalled();
      expect(jiraService.findTickets).not.toHaveBeenCalled();
      const $ = context.getCheerioBody();
      expect($('[data-macro-name="table-processor"]').length).toBe(0);
    });

    it('drops only the placeholder whose Jira search failed, leaving the others rendered', async () => {
      jiraService.findTickets
        .mockRejectedValueOnce(new Error('Jira is down'))
        .mockResolvedValueOnce({ data: { issues: [{ key: 'FND-9', fields: { status: statusField('Open') } }] } });

      context.setHtmlBody(processorViewHtml(2));
      context.setBodyStorage(buildProcessorStorage() + buildProcessorStorage());
      await expect(runStep()).resolves.toBeUndefined();

      const $ = context.getCheerioBody();
      expect($('[data-macro-name="table-processor"]').length).toBe(0);
      expect($('.konviw-table-chart').length).toBe(1);
    });

    it('leaves table-processor placeholders untouched (but still renders a sibling legacy chart) when getFields fails', async () => {
      jiraService.getFields.mockRejectedValue(new Error('Jira fields unavailable'));

      const combinedView = `
        <html><body><div id="Content">
          <div data-macro-name="table-chart"><iframe></iframe></div>
          ${processorViewHtml().replace(/<\/?html>|<\/?body>|<div id="Content">|<\/div>\s*<\/div>\s*$/g, '')}
        </div></body></html>`;
      context.setHtmlBody(combinedView);
      context.setBodyStorage(storageXml + buildProcessorStorage());
      await expect(runStep()).resolves.toBeUndefined();

      const $ = context.getCheerioBody();
      expect($('[data-macro-name="table-processor"]').length).toBe(1);
      expect($('.konviw-table-chart').length).toBe(1);
      expect($('script[data-konviw-apexcharts]').length).toBe(1);
      expect($('script[src*="gridjs.production.min.js"]').length).toBe(0);
    });

    it('removes a placeholder whose macro has no <ac:rich-text-body> at all', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({ includeRichTextBody: false }));
      await runStep();

      const $ = context.getCheerioBody();
      expect($('[data-macro-name="table-processor"]').length).toBe(0);
      expect($('.konviw-table-chart').length).toBe(0);
    });

    it('defaults a chart node with no type/aggregation params to a vertical bar named after its column', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({ chartParams: [{ column: 'Status' }] }));
      await runStep();

      const html = context.getHtmlBody();
      expect(html).toContain("type: 'bar'");
      expect(html).toContain('"name":"Status"');
    });

    it('tolerates a chart node with no params object at all', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({ chartParams: [undefined as unknown as Record<string, string>] }));
      await expect(runStep()).resolves.toBeUndefined();

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(0);
      expect(context.getHtmlBody()).toContain('id="gridjstp-0"');
    });

    it('skips the chart (but still renders the table) when the Jira search returns no issues', async () => {
      jiraService.findTickets.mockResolvedValue({ data: { issues: [] } });
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage());
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(0);
      expect(context.getHtmlBody()).toContain('id="gridjstp-0"');
    });

    it('tolerates a findTickets response with no data/issues shape', async () => {
      jiraService.findTickets.mockResolvedValue({});
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage());
      await expect(runStep()).resolves.toBeUndefined();

      expect(context.getHtmlBody()).toContain('id="gridjstp-0"');
    });

    it('tolerates findTickets resolving to undefined outright', async () => {
      jiraService.findTickets.mockResolvedValue(undefined);
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage());
      await expect(runStep()).resolves.toBeUndefined();

      expect(context.getHtmlBody()).toContain('id="gridjstp-0"');
    });

    it('tolerates getFields resolving to null (falls back to no known fields)', async () => {
      jiraService.getFields.mockResolvedValue(null);
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage());
      await expect(runStep()).resolves.toBeUndefined();

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(0);
      expect(context.getHtmlBody()).toContain('id="gridjstp-0"');
    });
  });

  describe('table-processor: Confluence-native table rendering (no iframe placeholder)', () => {
    beforeEach(() => {
      jiraService.getFields.mockResolvedValue([
        { id: 'status', name: 'Status', schema: { type: 'status' } },
      ]);
      jiraService.findTickets.mockResolvedValue({
        data: {
          issues: [
            { key: 'FND-1', fields: { status: statusField('Done') } },
            { key: 'FND-2', fields: { status: statusField('Open') } },
            { key: 'FND-3', fields: { status: statusField('Done') } },
          ],
        },
      });
    });

    it('replaces the native list-view table with the chart/table toggle when its count matches the storage macro count', async () => {
      context.setHtmlBody(processorNativeTableViewHtml());
      context.setBodyStorage(buildProcessorStorage());
      await runStep();

      expect(jiraService.findTickets).toHaveBeenCalledWith(
        'System JIRA',
        'project = FND',
        expect.stringContaining('status'),
      );

      const $ = context.getCheerioBody();
      expect($('table.jiraWorkItemMacroListViewTable').length).toBe(0);
      expect($('.konviw-tablechart-group').length).toBe(1);
      expect($('.konviw-tablechart-tab').length).toBe(2);
      expect($('script[data-konviw-apexcharts]').length).toBe(1);
      expect($('script[src*="gridjs.production.min.js"]').length).toBe(1);
    });

    it('matches multiple native tables to their storage macros by document order', async () => {
      context.setHtmlBody(processorNativeTableViewHtml(2));
      context.setBodyStorage(buildProcessorStorage() + buildProcessorStorage());
      await runStep();

      expect(jiraService.findTickets).toHaveBeenCalledTimes(2);
      const $ = context.getCheerioBody();
      expect($('table.jiraWorkItemMacroListViewTable').length).toBe(0);
      expect($('.konviw-tablechart-group').length).toBe(2);
    });

    it('leaves the native tables untouched when their count does not match the storage macro count (ambiguous correlation)', async () => {
      // Three native tables (e.g. an unrelated Jira Issues macro sharing the
      // same Confluence table class) but only one table-processor macro in
      // storage: matching by document order would be a guess, so skip
      // rendering entirely rather than risk misattributing a table.
      context.setHtmlBody(processorNativeTableViewHtml(3));
      context.setBodyStorage(buildProcessorStorage());
      await expect(runStep()).resolves.toBeUndefined();

      expect(jiraService.findTickets).not.toHaveBeenCalled();
      const $ = context.getCheerioBody();
      expect($('table.jiraWorkItemMacroListViewTable').length).toBe(3);
      expect($('.konviw-tablechart-group').length).toBe(0);
    });

    it('does nothing when there are no native tables and no iframe placeholders', async () => {
      context.setHtmlBody('<html><body><div id="Content"><p>no macros here</p></div></body></html>');
      context.setBodyStorage('');
      await runStep();

      expect(jiraService.getFields).not.toHaveBeenCalled();
      expect(jiraService.findTickets).not.toHaveBeenCalled();
    });
  });

  describe('table-processor filter dropdown ("Service Category ="-style control)', () => {
    beforeEach(() => {
      jiraService.getFields.mockResolvedValue([
        { id: 'status', name: 'Status', schema: { type: 'status' } },
        { id: 'customfield_svccat', name: 'Service Category', schema: { type: 'string' } },
      ]);
      jiraService.findTickets.mockResolvedValue({
        data: {
          issues: [
            { key: 'FND-1', fields: { status: statusField('Done'), customfield_svccat: 'Payroll' } },
            { key: 'FND-2', fields: { status: statusField('Open'), customfield_svccat: 'IT' } },
            { key: 'FND-3', fields: { status: statusField('Done'), customfield_svccat: 'Payroll' } },
          ],
        },
      });
    });

    it('renders a filter dropdown for the filter root\'s column with its distinct values, and requests the field from Jira', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({ filterParams: { column: 'Service Category', labels: 'Service Category' } }));
      await runStep();

      expect(jiraService.findTickets).toHaveBeenCalledWith(
        'System JIRA',
        'project = FND',
        expect.stringContaining('customfield_svccat'),
      );

      const $ = context.getCheerioBody();
      expect($('.konviw-tablechart-filter-bar').length).toBe(1);
      expect($('.konviw-tablechart-filter-label').text()).toBe('Service Category');
      const optionValues = $('.konviw-tablechart-filter option').map((_i, el) => $(el).text()).get();
      expect(optionValues).toEqual(['All', 'IT', 'Payroll']);
      expect($('script[data-konviw-tablechart-filter]').length).toBe(1);

      const html = context.getHtmlBody();
      expect(html).toContain('data-konviw-tablechart-data="konviw-tp-filter-0"');
      expect(html).toContain('"gridId":"tp-0"');
      expect(html).toContain('window.konviwCharts["jira-0-0"]');
    });

    it('does not render a filter when the configured column has only one distinct value', async () => {
      jiraService.findTickets.mockResolvedValue({
        data: {
          issues: [
            { key: 'FND-1', fields: { status: statusField('Done'), customfield_svccat: 'Payroll' } },
            { key: 'FND-2', fields: { status: statusField('Open'), customfield_svccat: 'Payroll' } },
          ],
        },
      });
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({ filterParams: { column: 'Service Category' } }));
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-tablechart-filter-bar').length).toBe(0);
      expect($('script[data-konviw-tablechart-filter]').length).toBe(0);
    });

    it('does not render a filter when the filter column does not resolve to a known Jira field', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({ filterParams: { column: 'Not A Real Field' } }));
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-tablechart-filter-bar').length).toBe(0);
      expect($('script[data-konviw-tablechart-filter]').length).toBe(0);
    });

    it('does not render a filter when the tree root is not a filter node', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({
        serialized: JSON.stringify([{ type: 'chart', params: { column: 'Status', aggregation: 'Status', type: 'Column' } }]),
      }));
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-tablechart-filter-bar').length).toBe(0);
      expect($('script[data-konviw-tablechart-filter]').length).toBe(0);
    });

    it('tolerates a filter root with no params object at all', async () => {
      context.setHtmlBody(processorViewHtml());
      context.setBodyStorage(buildProcessorStorage({ serialized: JSON.stringify([{ type: 'filter' }]) }));
      await expect(runStep()).resolves.toBeUndefined();

      const $ = context.getCheerioBody();
      expect($('.konviw-tablechart-filter-bar').length).toBe(0);
      expect($('script[data-konviw-tablechart-filter]').length).toBe(0);
      expect(context.getHtmlBody()).toContain('id="gridjstp-0"');
    });

    it('injects the filter-apply script only once across multiple filterable macros', async () => {
      context.setHtmlBody(processorViewHtml(2));
      const macro = buildProcessorStorage({ filterParams: { column: 'Service Category' } });
      context.setBodyStorage(macro + macro);
      await runStep();

      const $ = context.getCheerioBody();
      expect($('.konviw-tablechart-filter-bar').length).toBe(2);
      expect($('script[data-konviw-tablechart-filter]').length).toBe(1);
    });
  });

  describe('Legacy table-chart error handling', () => {
    it('never breaks the page when parsing the source table throws', async () => {
      const convertSpy = jest.spyOn(Tabletojson, 'convert').mockImplementation(() => {
        throw new Error('boom');
      });
      try {
        context.setHtmlBody(viewHtml);
        context.setBodyStorage(storageXml);
        await expect(runStep()).resolves.toBeUndefined();
        expect(context.getCheerioBody()('.konviw-table-chart').length).toBe(0);
      } finally {
        convertSpy.mockRestore();
      }
    });

    it('removes a table-chart placeholder that has neither a chart nor any source table', async () => {
      const emptyStorage = `
        <ac:structured-macro ac:name="table-chart" ac:schema-version="1">
          <ac:parameter ac:name="column">Month</ac:parameter>
          <ac:rich-text-body><p>no table here</p></ac:rich-text-body>
        </ac:structured-macro>`;
      context.setHtmlBody(viewHtml);
      context.setBodyStorage(emptyStorage);
      await runStep();

      const $ = context.getCheerioBody();
      expect($('[data-macro-name="table-chart"]').length).toBe(0);
      expect($('table.confluenceTable').length).toBe(0);
    });

    it('removes a table-chart placeholder with no matching storage macro (index mismatch)', async () => {
      context.setHtmlBody(viewHtml);
      context.setBodyStorage('');
      await runStep();

      expect(context.getCheerioBody()('[data-macro-name="table-chart"]').length).toBe(0);
    });
  });
});
