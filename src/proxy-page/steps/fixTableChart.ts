import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { Tabletojson } from 'tabletojson';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import { JiraService } from '../../jira/jira.service';
import * as tableProcessorJira from '../utils/tableProcessorJira';

const logger = new Logger('fixTableChart');

/**
 * ### Proxy page step to render the "Table Filters and Charts for Confluence"
 * (Stiltsoft) macro family.
 *
 * These macros are Atlassian Connect *dynamic content macros*: Confluence only
 * returns an empty iframe placeholder in the `body.view` format, so neither the
 * source table nor the chart are visible in a Konviw rendition. The macro data
 * does live in the `body.storage` format though, so — exactly like the API v2
 * fallback in {@link fixDrawio} — we parse the storage body, correlate the
 * macros to the view placeholders by document order and rebuild the output
 * ourselves. Two macro shapes are handled, under separate extension keys:
 *
 * - `table-chart` (legacy): a flat `<ac:parameter>` list plus an inline
 *   `<ac:rich-text-body><table>`. "Chart from Table" (a `type` parameter is
 *   present) is rendered as an interactive ApexCharts chart with the source
 *   table appended below unless configured to hide it (`hide=true`); any other
 *   variant (Table Filter, Pivot Table, ...) is rendered as its plain source
 *   table.
 * - `table-processor` (current): config lives in a single JSON tree (the
 *   `serialized` parameter) and the "table" is a live Jira search — the
 *   `<ac:rich-text-body>` holds a Jira smart-link datasource card (JQL +
 *   columns) instead of an inline `<table>`. We fetch the issues via
 *   `JiraService`, aggregate them (count per category — see
 *   {@link tableProcessorJira.aggregateByCategory}) for every `chart` node
 *   found in the tree, and always render the underlying issues as a Grid.js
 *   table below (reusing the same building blocks as `addJira.ts`'s
 *   `data-datasource` handling, which can't see this card itself since it only
 *   exists in the storage fallback body, never in the resolved view DOM).
 *
 * @returns Promise<void>
 */

// Stiltsoft joins the selected aggregation columns / pie keys with a
// SINGLE LOW-9 QUOTATION MARK (U+201A) instead of a regular comma.
const AGGREGATION_SEPARATOR = '\u201A';

type TableChartMacro = {
  params: Record<string, string>;
  tableHtml: string;
};

type TableProcessorMacro = {
  tree: tableProcessorJira.TableProcessorNode | null;
  datasource: tableProcessorJira.JiraDatasource | null;
};

/**
 * Decode HTML entities left untouched by cheerio's XML mode. Stiltsoft stores
 * the aggregation/pieKeys separator as the named entity `&sbquo;` (U+201A), so
 * without decoding the multi-column selections cannot be split correctly.
 */
const decodeEntities = (value: string): string => {
  if (!value || value.indexOf('&') === -1) return value;
  return cheerio.load(`<x>${value}</x>`, null, false)('x').text();
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
        if (name) params[name] = decodeEntities($xml(param).text());
      });

    const tableHtml = $xml.html($el.find(String.raw`ac\:rich-text-body table`).first());

    macros.push({ params, tableHtml });
  });

  return macros;
};

/**
 * Walk the storage XML and collect every `table-processor` macro in document
 * order (the current Stiltsoft extension key — see the file-level doc comment
 * for how its shape differs from the legacy `table-chart` macros above).
 */
const collectStorageTableProcessorMacros = (storageBody: string): TableProcessorMacro[] => {
  if (!storageBody) return [];
  const $xml = cheerio.load(storageBody, { xmlMode: true });
  const macros: TableProcessorMacro[] = [];

  $xml(String.raw`ac\:structured-macro[ac\:name="table-processor"]`).each((_i, el) => {
    const $el = $xml(el);

    const serializedRaw = decodeEntities(
      $el.children(String.raw`ac\:parameter[ac\:name="serialized"]`).text(),
    );
    const tree = tableProcessorJira.parseSerializedTree(serializedRaw);

    const richTextBody = $el.find(String.raw`ac\:rich-text-body`).get(0);
    const datasource = richTextBody
      ? tableProcessorJira.extractJiraDatasource($xml, richTextBody)
      : null;

    macros.push({ tree, datasource });
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
 * Render the ApexCharts `<div>` + `<script>` shell shared by both the legacy
 * table-driven chart and the Jira-count-driven chart: everything but the
 * series/categories data (already computed by the caller) is identical.
 */
const renderChartMarkup = (
  chartId: string,
  params: Record<string, string>,
  seriesOption: string,
  labelsOrXaxisOption: string,
): string => {
  const { apexType, horizontal, stacked } = resolveChartType(params.type);
  // Stiltsoft prints the value inside each bar segment / pie slice. Keep labels
  // off for line charts only, where they would clutter the plot.
  const showDataLabels = apexType !== 'line';

  const colors = splitList(params.colors);
  const colorsOption = colors.length > 0 ? `colors: ${JSON.stringify(colors)},` : '';
  const titleOption = params.title
    ? `title: { text: ${JSON.stringify(params.title)}, align: 'center' },`
    : '';

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
    ${labelsOrXaxisOption}
  }`;

  // The chart id may contain characters that aren't valid in a JS identifier
  // (e.g. the `jira-0-0` ids used for table-processor charts), so the variable
  // name is derived separately from the (HTML-id-safe) chartId.
  const varName = `chart_${chartId.replace(/\W/g, '_')}`;

  return `<div class="konviw-table-chart" id="konviw-table-chart-${chartId}"></div>
    <script type="module">
      document.addEventListener('DOMContentLoaded', function () {
        var ${varName} = new ApexCharts(
          document.querySelector('#konviw-table-chart-${chartId}'),
          ${options}
        );
        ${varName}.render();
        // Registered so a filter control elsewhere on the page (see the
        // table-processor filter dropdown) can update this chart client-side.
        window.konviwCharts = window.konviwCharts || {};
        window.konviwCharts[${JSON.stringify(chartId)}] = ${varName};
      });
    </script>`;
};

/**
 * Build the ApexCharts chart for a legacy `table-chart` macro from its already
 * parsed data table. Returns an empty string when there is no usable data so
 * the caller can fall back to rendering the plain table.
 */
const buildChart = (macro: TableChartMacro, index: number): string => {
  const tables = Tabletojson.convert(macro.tableHtml);
  const rows: Record<string, string>[] = tables[0] ?? [];
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  if (headers.length < 2) return '';

  const { params } = macro;
  const { apexType } = resolveChartType(params.type);
  const isCircular = apexType === 'pie' || apexType === 'donut';

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

  return renderChartMarkup(String(index), params, seriesOption, labelsOrXaxis);
};

/**
 * Build the ApexCharts chart for a `table-processor` chart node from
 * pre-aggregated categories/counts (see
 * {@link tableProcessorJira.aggregateByCategory}). Returns an empty string
 * when there are no categories so the caller can skip this chart.
 */
const buildJiraChart = (
  params: Record<string, string>,
  categories: string[],
  counts: number[],
  chartId: string,
): string => {
  if (categories.length === 0) return '';
  const { apexType } = resolveChartType(params.type);
  const isCircular = apexType === 'pie' || apexType === 'donut';
  // The caller only reaches this point once `params.column` has already
  // resolved to a real Jira field (see `resolveFieldId` at the call site), so
  // it's always defined here.
  const seriesName = params.aggregation || params.column;

  const seriesOption = isCircular
    ? `series: ${JSON.stringify(counts)},`
    : `series: ${JSON.stringify([{ name: seriesName, data: counts }])},`;
  const labelsOrXaxisOption = isCircular
    ? `labels: ${JSON.stringify(categories)},`
    : `xaxis: { categories: ${JSON.stringify(categories)} },`;

  return renderChartMarkup(chartId, params, seriesOption, labelsOrXaxisOption);
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

type TabView = { label: string; html: string };

/**
 * Readers only want to see one view at a time (a chart, or the table), not
 * both stacked. When there's more than one usable view, wraps them in a tab
 * toggle so the reader picks; falls straight through to the single view (no
 * tab UI at all) when there's nothing to choose between.
 */
const buildTabbedViews = (views: TabView[]): { html: string; usedTabs: boolean } => {
  const usableViews = views.filter((view) => view.html);
  if (usableViews.length <= 1) {
    return { html: usableViews[0]?.html ?? '', usedTabs: false };
  }

  const tabs = usableViews
    .map((view, i) => `<button type="button" class="konviw-tablechart-tab${i === 0 ? ' is-active' : ''}">${view.label}</button>`)
    .join('');
  const panels = usableViews
    .map((view, i) => `<div class="konviw-tablechart-panel${i === 0 ? ' is-active' : ''}">${view.html}</div>`)
    .join('');

  return {
    html: `<div class="konviw-tablechart-group">
      <div class="konviw-tablechart-tablist" role="tablist">${tabs}</div>
      ${panels}
    </div>`,
    usedTabs: true,
  };
};

// Injected once per page (guarded like the ApexCharts/Grid.js asset tags
// below) when at least one macro rendered a tab toggle. Matches tabs to
// panels by position within their `.konviw-tablechart-group`, so no ids are
// needed. Re-dispatches `resize` after switching so ApexCharts (which sizes
// itself off its container's width at render time) recomputes correctly when
// its panel was hidden — and therefore zero-width — at initial page load.
const TAB_TOGGLE_SCRIPT = `<script data-konviw-tablechart-toggle>
  document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('click', function (event) {
      var tab = event.target.closest && event.target.closest('.konviw-tablechart-tab');
      if (!tab) return;
      var group = tab.closest('.konviw-tablechart-group');
      if (!group) return;
      var tabs = Array.prototype.slice.call(group.querySelectorAll('.konviw-tablechart-tab'));
      var panels = Array.prototype.slice.call(group.querySelectorAll('.konviw-tablechart-panel'));
      var index = tabs.indexOf(tab);
      tabs.forEach(function (t) { t.classList.remove('is-active'); });
      panels.forEach(function (p) { p.classList.remove('is-active'); });
      tab.classList.add('is-active');
      if (panels[index]) panels[index].classList.add('is-active');
      window.dispatchEvent(new Event('resize'));
    });
  });
</script>`;

/**
 * Builds the `<select>` filter bar for a `table-processor` macro's `filter`
 * root node (e.g. the "Service Category =" control on the real macro). The
 * per-issue values/labels used to react to it are emitted separately by
 * {@link buildFilterDataScript}.
 */
const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const buildFilterBar = (label: string, options: string[], groupId: string): string => {
  const optionTags = options
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
    .join('');
  return `<div class="konviw-tablechart-filter-bar">
    <label class="konviw-tablechart-filter-label">${escapeHtml(label)}</label>
    <select class="konviw-tablechart-filter" data-konviw-filter-group="${groupId}">
      <option value="">All</option>
      ${optionTags}
    </select>
  </div>`;
};

/**
 * Embeds the per-issue raw data a filter change needs to re-aggregate the
 * chart(s) and re-filter the table client-side, without re-fetching from
 * Jira: the filter value per issue, each chart's own category value per
 * issue (index-aligned with `values`), the already-formatted Grid.js rows
 * (also index-aligned), and the Grid.js instance's id.
 */
const buildFilterDataScript = (
  groupId: string,
  values: string[],
  charts: { id: string; categories: string[] }[],
  tableRows: any[][],
  gridId: string,
): string => `<script data-konviw-tablechart-data="${groupId}">
  window.konviwTableProcessorData = window.konviwTableProcessorData || {};
  window.konviwTableProcessorData[${JSON.stringify(groupId)}] = ${JSON.stringify({
  values, charts, tableRows, gridId,
})};
</script>`;

// Injected once per page (guarded like the other shared assets) when at least
// one macro rendered a filter dropdown. Re-aggregates every chart (preserving
// first-seen category order, mirroring `aggregateByCategory` server-side) and
// re-filters the Grid.js table from the payload `buildFilterDataScript` embeds,
// entirely client-side — no re-fetch from Jira on filter change.
/**
 * The filter's core algorithm — which issues match the selected value, and
 * the resulting category/count grouping — as ordinary functions with no
 * closures over anything outside their own parameters. That makes them:
 * (a) directly unit-testable here in Node, no DOM/browser needed, and
 * (b) safe to inline into `FILTER_APPLY_SCRIPT` via `.toString()` below, so
 * the code under test is exactly the code shipped to the browser (see
 * `mirrors aggregateByCategory`'s first-seen-order grouping server-side).
 */
export function computeFilterMask(values: string[], selected: string): boolean[] {
  return values.map((value) => selected === '' || value === selected);
}

export function recomputeCategoryCounts(
  categories: string[],
  mask: boolean[],
): { order: string[]; counts: Record<string, number> } {
  const order: string[] = [];
  const counts: Record<string, number> = {};
  categories.forEach((label, i) => {
    if (!mask[i]) return;
    if (!(label in counts)) {
      order.push(label);
      counts[label] = 0;
    }
    counts[label] += 1;
  });
  return { order, counts };
}

const FILTER_APPLY_SCRIPT = `<script data-konviw-tablechart-filter>
  ${computeFilterMask};
  ${recomputeCategoryCounts};
  document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('change', function (event) {
      var select = event.target;
      if (!select.classList || !select.classList.contains('konviw-tablechart-filter')) return;
      var groupId = select.getAttribute('data-konviw-filter-group');
      var payload = window.konviwTableProcessorData && window.konviwTableProcessorData[groupId];
      if (!payload) return;

      var mask = computeFilterMask(payload.values, select.value);

      payload.charts.forEach(function (chart) {
        var result = recomputeCategoryCounts(chart.categories, mask);
        var order = result.order;
        var counts = result.counts;
        var apex = window.konviwCharts && window.konviwCharts[chart.id];
        if (!apex) return;
        var chartType = apex.w && apex.w.config && apex.w.config.chart && apex.w.config.chart.type;
        var isCircular = chartType === 'pie' || chartType === 'donut';
        // Categories and series are merged into a SINGLE updateOptions() call
        // (rather than a separate updateOptions() + updateSeries()) with
        // redrawPaths=true: when the number of categories changes, splitting
        // the update into two calls (or skipping the axis path redraw) left
        // the previous render's rotated axis labels on screen, overlapping
        // the new ones instead of being replaced by them.
        if (isCircular) {
          apex.updateOptions({
            labels: order,
            series: order.map(function (label) { return counts[label]; }),
          }, true, true);
        } else {
          var seriesName = (apex.w.config.series[0] && apex.w.config.series[0].name) || 'Count';
          apex.updateOptions({
            xaxis: { categories: order },
            series: [{ name: seriesName, data: order.map(function (label) { return counts[label]; }) }],
          }, true, true);
        }
      });

      var grid = window.konviwGrids && window.konviwGrids[payload.gridId];
      if (grid) {
        var filteredRows = payload.tableRows.filter(function (_row, i) { return mask[i]; });
        grid.updateConfig({ data: filteredRows }).forceRender();
      }
    });
  });
</script>`;

// Only called by the default export when it has already confirmed at least
// one `table-chart` placeholder exists, so `placeholders` is never empty here.
const renderLegacyTableChartMacros = (
  $: cheerio.CheerioAPI,
  storageBody: string,
): { needsApexCharts: boolean; needsTabScript: boolean } => {
  const placeholders = $('[data-macro-name="table-chart"]');
  let needsApexCharts = false;
  let needsTabScript = false;
  const macros = collectStorageTableChartMacros(storageBody);

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
        // The source table is a data source hidden by default; only show it
        // when the macro is explicitly configured to keep it visible — and
        // when both are shown, let the reader pick one via a tab toggle
        // instead of always stacking them.
        const table = macro.params.hide !== 'true' ? buildTable(macro) : '';
        const tabbed = buildTabbedViews([{ label: 'Chart', html: chart }, { label: 'Table', html: table }]);
        output = tabbed.html;
        if (tabbed.usedTabs) needsTabScript = true;
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

  return { needsApexCharts, needsTabScript };
};

/**
 * Fetch and render a single `table-processor` macro's Jira-backed content:
 * every `chart` node in its tree as an ApexCharts chart, plus the underlying
 * issues as a Grid.js table underneath. Returns null when there's nothing
 * fetchable (no datasource) so the caller falls back to a plain message.
 */
const renderJiraTableProcessorMacro = async (
  macro: TableProcessorMacro,
  placeholderIndex: number,
  jiraService: JiraService,
  jiraFields: any[],
  baseUrl: string,
): Promise<{ html: string; hasChart: boolean; usedTabs: boolean; usedFilter: boolean } | null> => {
  const { datasource, tree } = macro;
  if (!datasource) return null;

  const chartNodes = findChartNodesSafe(tree);
  const chartFieldIds = new Set<string>();
  chartNodes.forEach((node) => {
    const columnId = tableProcessorJira.resolveFieldId(node.params?.column, jiraFields);
    if (columnId) chartFieldIds.add(columnId);
  });

  // The root `filter` node's own column (e.g. "Service Category" in the real
  // macro's filter chip) isn't necessarily one of the table/chart columns
  // already being fetched, so it needs to be requested explicitly too.
  const filterLabel: string | undefined = tree?.type === 'filter'
    ? (tree.params?.labels || tree.params?.column)
    : undefined;
  const filterColumnId = tableProcessorJira.resolveFieldId(tree?.params?.column, jiraFields);
  if (filterColumnId) chartFieldIds.add(filterColumnId);

  const fields = Array.from(new Set([...datasource.columnKeys, ...chartFieldIds]));
  const response = await jiraService.findTickets('System JIRA', datasource.jql, fields.join(','));
  const issues = response?.data?.issues ?? [];

  const chartHtmls: string[] = [];
  const chartPayloads: { id: string; categories: string[] }[] = [];

  chartNodes.forEach((node, chartIndex) => {
    const columnId = tableProcessorJira.resolveFieldId(node.params?.column, jiraFields);
    if (!columnId) return;
    const perIssueLabels = tableProcessorJira.extractPerIssueLabels(issues, columnId);
    const { categories, counts } = tableProcessorJira.aggregateByCategory(issues, columnId);
    const chartId = `jira-${placeholderIndex}-${chartIndex}`;
    // `columnId` only resolved above because `node.params.column` was truthy,
    // so `node.params` is guaranteed to exist here.
    const chart = buildJiraChart(node.params as Record<string, string>, categories, counts, chartId);
    if (chart) {
      chartHtmls.push(chart);
      chartPayloads.push({ id: chartId, categories: perIssueLabels });
    }
  });

  const gridId = `tp-${placeholderIndex}`;
  const table = tableProcessorJira.buildJiraGridTable(
    issues,
    datasource.columnKeys,
    jiraFields,
    baseUrl,
    gridId,
  );

  // Only number the chart tabs ("Chart 1", "Chart 2", ...) when there's more
  // than one, so the common single-chart case just reads "Chart".
  const views: TabView[] = [
    ...chartHtmls.map((html, i) => ({ label: chartHtmls.length > 1 ? `Chart ${i + 1}` : 'Chart', html })),
    { label: 'Table', html: table.html },
  ];
  const tabbed = buildTabbedViews(views);

  // Only offer the filter dropdown when it actually narrows anything: it
  // needs to resolve to a real field with 2+ distinct values across the
  // fetched issues (a single-value filter is a no-op, not worth a control).
  const filterValues = filterColumnId ? tableProcessorJira.extractPerIssueLabels(issues, filterColumnId) : [];
  const filterOptions = tableProcessorJira.distinctSortedLabels(filterValues);
  const usedFilter = Boolean(filterLabel) && filterOptions.length > 1;

  const groupId = `konviw-tp-filter-${placeholderIndex}`;
  const html = usedFilter
    ? buildFilterBar(filterLabel as string, filterOptions, groupId)
      + tabbed.html
      + buildFilterDataScript(groupId, filterValues, chartPayloads, table.rows, gridId)
    : tabbed.html;

  return {
    html, hasChart: chartHtmls.length > 0, usedTabs: tabbed.usedTabs, usedFilter,
  };
};

// `findChartNodes` narrowed to tolerate a null tree (malformed `serialized` param).
const findChartNodesSafe = (
  tree: tableProcessorJira.TableProcessorNode | null,
): tableProcessorJira.TableProcessorNode[] => tableProcessorJira.findChartNodes(tree);

// Only called by the default export when it has already confirmed at least
// one `table-processor` placeholder exists, so `placeholders` is never empty here.
const renderTableProcessorMacros = async (
  $: cheerio.CheerioAPI,
  storageBody: string,
  config: ConfigService,
  jiraService: JiraService,
): Promise<{ needsApexCharts: boolean; needsGridjs: boolean; needsTabScript: boolean; needsFilterScript: boolean }> => {
  const placeholders = $('[data-macro-name="table-processor"]');
  const macros = collectStorageTableProcessorMacros(storageBody);
  const baseUrl = config.get('confluence.baseURL');

  let jiraFields: any[] = [];
  if (macros.some((macro) => macro.datasource)) {
    jiraFields = (await jiraService.getFields()) ?? [];
  }

  let needsApexCharts = false;
  let needsGridjs = false;
  let needsTabScript = false;
  let needsFilterScript = false;

  const elements = placeholders.toArray();
  await Promise.all(elements.map(async (element, index) => {
    const macro = macros[index];
    if (!macro) {
      $(element).remove();
      return;
    }

    try {
      const rendered = await renderJiraTableProcessorMacro(
        macro,
        index,
        jiraService,
        jiraFields,
        baseUrl,
      );

      if (!rendered?.html) {
        // No parseable Jira datasource, or the search returned nothing usable:
        // drop the empty placeholder rather than leaking the iframe stub.
        $(element).remove();
        return;
      }

      needsGridjs = true;
      if (rendered.hasChart) needsApexCharts = true;
      if (rendered.usedTabs) needsTabScript = true;
      if (rendered.usedFilter) needsFilterScript = true;
      $(element).replaceWith(rendered.html);
    } catch (error) {
      logger.error(`Failed to render table-processor macro at index ${index}: ${(error as Error).message}`);
      $(element).remove();
    }
  }));

  return {
    needsApexCharts, needsGridjs, needsTabScript, needsFilterScript,
  };
};

export default (config: ConfigService, jiraService: JiraService): Step => async (
  context: ContextService,
): Promise<void> => {
  context.setPerfMark('fixTableChart');
  const $ = context.getCheerioBody();

  const hasLegacyPlaceholders = $('[data-macro-name="table-chart"]').length > 0;
  const hasProcessorPlaceholders = $('[data-macro-name="table-processor"]').length > 0;

  if (!hasLegacyPlaceholders && !hasProcessorPlaceholders) {
    context.getPerfMeasure('fixTableChart');
    return;
  }

  const storageBody = context.getBodyStorage();
  let needsApexCharts = false;
  let needsGridjs = false;
  let needsTabScript = false;
  let needsFilterScript = false;

  try {
    if (hasLegacyPlaceholders) {
      const result = renderLegacyTableChartMacros($, storageBody);
      needsApexCharts = result.needsApexCharts;
      needsTabScript = result.needsTabScript;
    }
  } catch (error) {
    // Never let an unexpected parsing/rendering error break the whole page:
    // log it and leave the original placeholders untouched.
    logger.error(`Failed to render table-chart macro(s): ${(error as Error).message}`);
  }

  if (hasProcessorPlaceholders) {
    try {
      const result = await renderTableProcessorMacros($, storageBody, config, jiraService);
      needsApexCharts = needsApexCharts || result.needsApexCharts;
      needsGridjs = result.needsGridjs;
      needsTabScript = needsTabScript || result.needsTabScript;
      needsFilterScript = result.needsFilterScript;
    } catch (error) {
      logger.error(`Failed to render table-processor macro(s): ${(error as Error).message}`);
    }
  }

  if (needsApexCharts && $('script[data-konviw-apexcharts]').length === 0) {
    $('body').append(
      '<script defer data-konviw-apexcharts src="https://cdn.jsdelivr.net/npm/apexcharts"></script>',
    );
  }

  // addJira.ts injects the same Grid.js assets unconditionally when it handles
  // its own `[data-datasource]` elements; guard against double-injecting them.
  if (needsGridjs && $('script[src*="gridjs.production.min.js"]').length === 0) {
    const basePath = config.get('web.basePath');
    const version = config.get('version');
    $('head').append(
      `<link href="${basePath}/gridjs/mermaid.min.css?cache=${version}" rel="stylesheet" />`,
    );
    $('body').append(
      `<script defer src="${basePath}/gridjs/gridjs.production.min.js?cache=${version}"></script>`,
    );
  }

  if (needsTabScript && $('script[data-konviw-tablechart-toggle]').length === 0) {
    $('body').append(TAB_TOGGLE_SCRIPT);
  }

  if (needsFilterScript && $('script[data-konviw-tablechart-filter]').length === 0) {
    $('body').append(FILTER_APPLY_SCRIPT);
  }

  context.getPerfMeasure('fixTableChart');
};
