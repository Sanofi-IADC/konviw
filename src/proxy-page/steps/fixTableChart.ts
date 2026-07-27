import * as cheerio from 'cheerio';
import { Tabletojson } from 'tabletojson';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';

/**
 * ### Proxy page step to render the "Table Filters and Charts for Confluence"
 * (Stiltsoft) macro family, whose macros are stored under the `table-chart`
 * extension key (`com.atlassian.confluence.macro.core`).
 *
 * These macros are Atlassian Connect *dynamic content macros*: Confluence only
 * returns an empty iframe placeholder (`[data-macro-name="table-chart"]`) in the
 * `body.view` format, so neither the source table nor the chart are visible in a
 * Konviw rendition. The macro data (parameters + the source table) does live in
 * the `body.storage` format though, so — exactly like the API v2 fallback in
 * {@link fixDrawio} — we parse the storage body, correlate the macros to the
 * view placeholders by document order and rebuild the output ourselves:
 *
 * - "Chart from Table" (a `type` parameter is present) is rendered as an
 *   interactive ApexCharts chart. The source table is appended below the chart
 *   unless the macro is configured to hide it (`hide=true`).
 * - Any other variant (Table Filter, Pivot Table, ...) is rendered as its plain
 *   source table so at least the tabular data is displayed.
 *
 * @returns void
 */

// Stiltsoft joins the selected aggregation columns / pie keys with a
// SINGLE LOW-9 QUOTATION MARK (U+201A) instead of a regular comma.
const AGGREGATION_SEPARATOR = '\u201A';

type TableChartMacro = {
  params: Record<string, string>;
  tableHtml: string;
};

/**
 * Walk the storage XML and collect every `table-chart` macro in document order.
 * Confluence serializes `com.atlassian.confluence.macro.core` extensions as
 * classic `<ac:structured-macro ac:name="table-chart">` nodes whose parameters
 * live in `<ac:parameter>` children and whose data table lives in the
 * `<ac:rich-text-body>`.
 */
const collectStorageTableChartMacros = (storageBody: string): TableChartMacro[] => {
  if (!storageBody) return [];
  const $xml = cheerio.load(storageBody, { xmlMode: true });
  const macros: TableChartMacro[] = [];

  $xml(String.raw`ac\:structured-macro[ac\:name="table-chart"]`).each((_i, el) => {
    const $el = $xml(el);

    const params: Record<string, string> = {};
    $el
      .children(String.raw`ac\:parameter`)
      .each((_j, param) => {
        const name = $xml(param).attr('ac:name');
        if (name) params[name] = $xml(param).text();
      });

    const tableHtml = $xml.html($el.find(String.raw`ac\:rich-text-body table`).first());

    macros.push({ params, tableHtml });
  });

  return macros;
};

/**
 * Map the Stiltsoft chart `type` parameter to an ApexCharts type plus the
 * horizontal/stacked modifiers.
 */
const resolveChartType = (
  type: string,
): { apexType: string; horizontal: boolean; stacked: boolean } => {
  const value = (type ?? '').toLowerCase();
  const stacked = value.startsWith('stacked');
  if (value.includes('pie')) return { apexType: 'pie', horizontal: false, stacked: false };
  if (value.includes('donut') || value.includes('doughnut')) {
    return { apexType: 'donut', horizontal: false, stacked: false };
  }
  if (value.includes('area')) return { apexType: 'area', horizontal: false, stacked };
  if (value.includes('line')) return { apexType: 'line', horizontal: false, stacked: false };
  if (value.includes('bar')) return { apexType: 'bar', horizontal: true, stacked };
  // "Column" / "Stacked Column" and anything unknown default to vertical bars
  return { apexType: 'bar', horizontal: false, stacked };
};

const parseNumber = (raw: string): number => {
  if (raw === undefined || raw === null) return 0;
  // strip everything but digits, sign, decimal point and exponent markers
  const cleaned = String(raw).replace(/[^0-9.eE+-]/g, '');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
};

const splitList = (raw: string): string[] => {
  if (!raw) return [];
  return raw
    .split(new RegExp(`[${AGGREGATION_SEPARATOR},]`))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const legendOption = (legend: string): string => {
  const value = (legend ?? '').toLowerCase();
  if (value === 'false' || value === 'none' || value === 'off') {
    return 'legend: { show: false },';
  }
  const position = ['top', 'right', 'bottom', 'left'].includes(value) ? value : 'bottom';
  return `legend: { show: true, position: '${position}' },`;
};

/**
 * Build the ApexCharts `<div>` + `<script>` for a chart macro from its already
 * parsed data table. Returns an empty string when there is no usable data so the
 * caller can fall back to rendering the plain table.
 */
const buildChart = (macro: TableChartMacro, index: number): string => {
  const tables = Tabletojson.convert(macro.tableHtml);
  const rows: Record<string, string>[] = tables[0] ?? [];
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  if (headers.length < 2) return '';

  const { params } = macro;
  const { apexType, horizontal, stacked } = resolveChartType(params.type);
  const isCircular = apexType === 'pie' || apexType === 'donut';
  // Stiltsoft prints the value inside each bar segment / pie slice. Keep labels
  // off for line charts only, where they would clutter the plot.
  const showDataLabels = apexType !== 'line';

  // The category column (X axis). Default to the first column.
  const categoryColumn = headers.includes(params.column) ? params.column : headers[0];

  // The value columns (series). Prefer the explicit aggregation selection and
  // fall back to every column that is not the category column.
  const requestedSeries = splitList(params.aggregation).filter((col) => headers.includes(col));
  const seriesColumns = requestedSeries.length > 0
    ? requestedSeries
    : headers.filter((header) => header !== categoryColumn);
  if (seriesColumns.length === 0) return '';

  const categories = rows.map((row) => row[categoryColumn]);

  const colors = splitList(params.colors);
  const colorsOption = colors.length > 0 ? `colors: ${JSON.stringify(colors)},` : '';
  const titleOption = params.title
    ? `title: { text: ${JSON.stringify(params.title)}, align: 'center' },`
    : '';

  let seriesOption: string;
  let labelsOrXaxis: string;

  if (isCircular) {
    const valueColumn = seriesColumns[0];
    seriesOption = `series: ${JSON.stringify(rows.map((row) => parseNumber(row[valueColumn])))},`;
    labelsOrXaxis = `labels: ${JSON.stringify(categories)},`;
  } else {
    const series = seriesColumns.map((column) => ({
      name: column,
      data: rows.map((row) => parseNumber(row[column])),
    }));
    seriesOption = `series: ${JSON.stringify(series)},`;
    labelsOrXaxis = `xaxis: { categories: ${JSON.stringify(categories)} },`;
  }

  const options = `{
    chart: { type: '${apexType}', height: 400, stacked: ${stacked}, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: ${horizontal}, borderRadius: 4, dataLabels: { position: 'center' } } },
    ${colorsOption}
    ${titleOption}
    ${legendOption(params.legend)}
    dataLabels: {
      enabled: ${showDataLabels},
      formatter: function (val) { return val === 0 ? '' : String(val); },
      style: { fontSize: '12px', fontWeight: 600, colors: ['#172b4d'] },
      background: { enabled: true, foreColor: '#ffffff', opacity: 0.7, borderWidth: 0, borderRadius: 2 },
      dropShadow: { enabled: false },
    },
    ${seriesOption}
    ${labelsOrXaxis}
  }`;

  return `<div class="konviw-table-chart" id="konviw-table-chart-${index}"></div>
    <script type="module">
      document.addEventListener('DOMContentLoaded', function () {
        var chart${index} = new ApexCharts(
          document.querySelector('#konviw-table-chart-${index}'),
          ${options}
        );
        chart${index}.render();
      });
    </script>`;
};

/**
 * Render the plain source table so at least the tabular data is displayed.
 * Adds the Confluence table classes so the later table-related steps
 * (addTableResponsive, fixTableSize, ...) pick it up.
 */
const buildTable = (macro: TableChartMacro): string => {
  if (!macro.tableHtml) return '';
  const $table = cheerio.load(macro.tableHtml, null, false);
  $table('table').addClass('confluenceTable');
  $table('th').addClass('confluenceTh');
  $table('td').addClass('confluenceTd');
  return `<div class="table-wrap">${$table.html()}</div>`;
};

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixTableChart');
  const $ = context.getCheerioBody();

  const placeholders = $('[data-macro-name="table-chart"]');
  if (placeholders.length === 0) {
    context.getPerfMeasure('fixTableChart');
    return;
  }

  const macros = collectStorageTableChartMacros(context.getBodyStorage());
  let needsApexCharts = false;

  placeholders.each((index: number, element: cheerio.Element) => {
    const macro = macros[index];
    if (!macro) {
      // No matching storage data: drop the empty placeholder to avoid leaking
      // the unusable iframe stub into the rendition.
      $(element).remove();
      return;
    }

    const isChart = Boolean(macro.params.type);
    let output = '';

    if (isChart) {
      const chart = buildChart(macro, index);
      if (chart) {
        needsApexCharts = true;
        output = chart;
        // The source table is a data source hidden by default; only show it
        // when the macro is explicitly configured to keep it visible.
        if (macro.params.hide !== 'true') {
          output += buildTable(macro);
        }
      }
    }

    if (!output) {
      // Table Filter / Pivot Table variants (or a chart without usable data):
      // fall back to the plain source table.
      output = buildTable(macro);
    }

    if (output) {
      $(element).replaceWith(output);
    } else {
      $(element).remove();
    }
  });

  if (needsApexCharts && $('script[data-konviw-apexcharts]').length === 0) {
    $('body').append(
      '<script defer data-konviw-apexcharts src="https://cdn.jsdelivr.net/npm/apexcharts"></script>',
    );
  }

  context.getPerfMeasure('fixTableChart');
};
