import { ContextService } from '../../../src/context/context.service';
import fixTableChart from '../../../src/proxy-page/steps/fixTableChart';
import { createModuleRefForStep } from './utils';

// Stiltsoft joins the selected aggregation columns with U+201A (‚), not a comma.
const SEP = '\u201A';

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

describe('ConfluenceProxy / fixTableChart', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'XXX', '60616441914', 'dark');
  });

  describe('Chart from Table (hidden source table)', () => {
    beforeEach(() => {
      context.setHtmlBody(viewHtml);
      context.setBodyStorage(storageXml);
      fixTableChart()(context);
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
    it('renders both the chart and the source table when hide!=true', () => {
      const storageVisible = storageXml.replace(
        '<ac:parameter ac:name="hide">true</ac:parameter>',
        '<ac:parameter ac:name="hide">false</ac:parameter>',
      );
      context.setHtmlBody(viewHtml);
      context.setBodyStorage(storageVisible);
      fixTableChart()(context);

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(1);
      expect($('table.confluenceTable').length).toBe(1);
      expect($('table.confluenceTable').text()).toContain('May');
    });
  });

  describe('Pie chart', () => {
    it('emits labels and a flat series array for a pie chart', () => {
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
      fixTableChart()(context);

      const html = context.getHtmlBody();
      expect(html).toContain("type: 'pie'");
      expect(html).toContain('series: [1500,2900,900]');
      expect(html).toContain('labels: ["Not Managed","MCE","Central Jira"]');
    });
  });

  describe('Table Filter / Pivot Table variants (no chart type)', () => {
    it('renders the plain source table when the macro has no type', () => {
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
      fixTableChart()(context);

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(0);
      expect($('table.confluenceTable').length).toBe(1);
      expect($('table.confluenceTable').text()).toContain('2300');
      expect($('script[data-konviw-apexcharts]').length).toBe(0);
    });
  });

  describe('Multiple macros correlated by document order', () => {
    it('matches each placeholder with the storage macro at the same index', () => {
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
      fixTableChart()(context);

      const $ = context.getCheerioBody();
      expect($('.konviw-table-chart').length).toBe(2);
      const html = context.getHtmlBody();
      expect(html).toContain("type: 'bar'");
      expect(html).toContain("type: 'pie'");
    });
  });

  describe('No placeholders present', () => {
    it('does nothing when the page has no table-chart macros', () => {
      const plain = '<html><body><div id="Content"><p>hello</p></div></body></html>';
      context.setHtmlBody(plain);
      context.setBodyStorage('');
      fixTableChart()(context);
      expect(context.getHtmlBody()).toContain('hello');
      expect(context.getCheerioBody()('script[data-konviw-apexcharts]').length).toBe(0);
    });
  });

  // Helper to render a single chart macro of a given type and return the
  // generated HTML (including the ApexCharts options script).
  const renderChart = (type: string, extraParams = '', tableRows?: string): string => {
    const rows = tableRows
      ?? `<tr><th><p>Month</p></th><th><p>Not Managed</p></th><th><p>MCE</p></th></tr>
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
    fixTableChart()(context);
    return context.getHtmlBody();
  };

  describe('Data labels (WEB-2452 values on bars)', () => {
    it('enables data labels for bar/column charts', () => {
      expect(renderChart('Column')).toContain('enabled: true');
    });

    it('uses a readable dark label color with a background pill', () => {
      const html = renderChart('Column');
      expect(html).toContain("colors: ['#172b4d']");
      expect(html).toContain('background: { enabled: true');
    });

    it('blanks out zero values so empty categories show no label', () => {
      const html = renderChart('Column');
      expect(html).toContain("return val === 0 ? '' : String(val);");
    });

    it('disables data labels for line charts to avoid clutter', () => {
      expect(renderChart('Line')).toContain('enabled: false');
    });

    it('enables data labels for pie charts', () => {
      const html = renderChart(
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
    it('renders "Bar" as a horizontal bar chart', () => {
      const html = renderChart('Bar');
      expect(html).toContain("type: 'bar'");
      expect(html).toContain('horizontal: true');
    });

    it('renders "Column" as a vertical (non-horizontal) bar chart', () => {
      const html = renderChart('Column');
      expect(html).toContain("type: 'bar'");
      expect(html).toContain('horizontal: false');
      expect(html).toContain('stacked: false');
    });

    it('renders "Stacked Bar" as a horizontal stacked bar chart', () => {
      const html = renderChart('Stacked Bar');
      expect(html).toContain('horizontal: true');
      expect(html).toContain('stacked: true');
    });

    it('renders "Area" as an area chart', () => {
      expect(renderChart('Area')).toContain("type: 'area'");
    });

    it('renders "Donut" as a donut chart', () => {
      const html = renderChart(
        'Donut',
        '',
        `<tr><th><p>Month</p></th><th><p>Value</p></th></tr>
         <tr><td><p>May</p></td><td><p>2300</p></td></tr>`,
      );
      expect(html).toContain("type: 'donut'");
    });

    it('defaults an unknown type to a vertical bar chart', () => {
      const html = renderChart('SomethingWeird');
      expect(html).toContain("type: 'bar'");
      expect(html).toContain('horizontal: false');
    });
  });

  describe('Legend option', () => {
    it('hides the legend when legend=false', () => {
      const html = renderChart('Column', '<ac:parameter ac:name="legend">false</ac:parameter>');
      expect(html).toContain('legend: { show: false }');
    });

    it('positions the legend when a valid position is given', () => {
      const html = renderChart('Column', '<ac:parameter ac:name="legend">top</ac:parameter>');
      expect(html).toContain("position: 'top'");
    });

    it('falls back to a bottom legend for an unknown position value', () => {
      const html = renderChart('Column', '<ac:parameter ac:name="legend">weird</ac:parameter>');
      expect(html).toContain("position: 'bottom'");
    });
  });

  describe('Title option', () => {
    it('adds a chart title when the title parameter is set', () => {
      const html = renderChart('Column', '<ac:parameter ac:name="title">My chart</ac:parameter>');
      expect(html).toContain('title: { text: "My chart"');
    });

    it('omits the title block when no title parameter is set', () => {
      expect(renderChart('Column')).not.toContain('title: { text:');
    });
  });

  describe('Numeric parsing', () => {
    it('strips thousands separators and spaces from numeric cells', () => {
      const html = renderChart(
        'Column',
        '<ac:parameter ac:name="aggregation">Value</ac:parameter>',
        `<tr><th><p>Month</p></th><th><p>Value</p></th></tr>
         <tr><td><p>May</p></td><td><p>2,300</p></td></tr>
         <tr><td><p>June</p></td><td><p>1 500</p></td></tr>`,
      );
      expect(html).toContain('"data":[2300,1500]');
    });
  });
});
