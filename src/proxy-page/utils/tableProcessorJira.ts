import * as cheerio from 'cheerio';
import * as FieldInterfaces from '../dto/FieldInterface';
import * as jiraGrid from './jiraGrid';

/**
 * Newer releases of the Stiltsoft "Table Filter, Charts & Spreadsheets" macro
 * (`ac:name="table-processor"`) store their configuration as a tree of these
 * nodes in a single `serialized` JSON parameter, instead of the classic flat
 * `<ac:parameter>` list. A `filter` root commonly wraps `chart`/`pivot`
 * children — see {@link findChartNodes}.
 */
export type TableProcessorNode = {
  type?: string;
  isActive?: boolean;
  params?: Record<string, any>;
  child?: TableProcessorNode[];
};

export type JiraDatasource = {
  jql: string;
  columnKeys: string[];
};

/**
 * Parse the macro's `serialized` parameter (already HTML-entity-decoded by the
 * caller). Returns null on any malformed/unexpected shape so callers can fall
 * back gracefully instead of throwing.
 */
export const parseSerializedTree = (raw: string): TableProcessorNode | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const root = Array.isArray(parsed) ? parsed[0] : parsed;
    return root ?? null;
  } catch {
    return null;
  }
};

/** Depth-first search for every `chart`-type node anywhere in the tree. */
export const findChartNodes = (root: TableProcessorNode | null): TableProcessorNode[] => {
  if (!root) return [];
  const nodes: TableProcessorNode[] = [];
  const stack: TableProcessorNode[] = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node) {
      if (node.type === 'chart') nodes.push(node);
      (node.child ?? []).forEach((child) => stack.push(child));
    }
  }
  return nodes;
};

/**
 * These macro instances source their "table" from a live Jira search instead
 * of an inline `<table>`: the `<ac:rich-text-body>` holds a Jira smart-link
 * "datasource" card (`<a data-datasource="{...}">`) carrying the JQL and the
 * columns the user picked for the underlying table view.
 */
export const extractJiraDatasource = (
  $xml: cheerio.CheerioAPI,
  richTextBodyEl: cheerio.Element,
): JiraDatasource | null => {
  const raw = $xml(richTextBodyEl).find('a[data-datasource]').first().attr('data-datasource');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const jql = parsed?.parameters?.jql;
    const columns = parsed?.views?.[0]?.properties?.columns;
    if (!jql || !Array.isArray(columns)) return null;
    const columnKeys: string[] = columns
      .map((column: { key?: string }) => column?.key)
      .filter(Boolean);
    if (columnKeys.length === 0) return null;
    return { jql, columnKeys };
  } catch {
    return null;
  }
};

/**
 * The chart/pivot params reference Jira fields by their display label (e.g.
 * `"Submitted month"`), not their id, so a lookup against `JiraService.getFields()`
 * is needed before the value can be pulled off a fetched issue.
 */
export const resolveFieldId = (label: string, jiraFields: any[]): string | undefined => {
  if (!label) return undefined;
  const normalized = label.trim().toLowerCase();
  const field = (jiraFields ?? []).find(
    (candidate) => (candidate?.name ?? '').trim().toLowerCase() === normalized,
  );
  return field?.id;
};

/**
 * Turn a raw Jira issue field value into a single display label suitable for
 * grouping. Unlike `FieldInterface.ts`'s `fieldFunctions` (grid-display
 * oriented: they array-wrap every value and locale-format dates), this reads
 * the field's raw shape directly so category buckets compare on plain values.
 */
/**
 * Some marketplace "date bucket" custom fields (e.g. a "Month" grouping
 * field) store their value as a JSON-encoded string instead of a plain
 * label — e.g. `{"start":"2026-07-01","end":"2026-07-31"}` for a "Submitted
 * month" field. Detect that shape and render the month/year the range
 * starts in, instead of dumping the raw JSON text onto the chart/table.
 * Returns null for anything that doesn't match so the caller can fall back.
 */
const extractDateRangeLabel = (raw: string): string | null => {
  if (!raw.startsWith('{') || !raw.includes('"start"')) return null;
  try {
    // `raw` starts with '{' (checked above), so a successful JSON.parse of it
    // always yields a non-null object — `parsed.start` is safe without `?.`.
    const parsed = JSON.parse(raw);
    if (typeof parsed.start !== 'string') return null;
    const date = new Date(parsed.start);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  } catch {
    return null;
  }
};

export const extractGroupLabel = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map((item) => extractGroupLabel(item)).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    if (typeof value.value === 'string') return value.value;
    if (typeof value.name === 'string') return value.name;
    return '';
  }
  if (typeof value === 'string') {
    return extractDateRangeLabel(value) ?? value;
  }
  return String(value);
};

/**
 * The per-issue label for a field, in fetch order. Used both for the initial
 * server-side aggregation below and as the raw payload sent to the browser so
 * a chart/table can be re-aggregated client-side when the reader changes the
 * "Service Category"-style filter dropdown (see `fixTableChart.ts`).
 */
export const extractPerIssueLabels = (issues: any[], fieldId: string): string[] =>
  (issues ?? []).map((issue) => extractGroupLabel(issue?.fields?.[fieldId]) || 'Unspecified');

/**
 * The distinct values of a per-issue label list, alphabetically sorted —
 * used to populate a filter dropdown's options.
 */
export const distinctSortedLabels = (labels: string[]): string[] =>
  Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b));

/**
 * V1 aggregation is count-of-issues-per-category only (see plan/context for
 * why): groups issues by the category field's label, in first-seen order.
 */
export const aggregateByCategory = (
  issues: any[],
  categoryFieldId: string,
): { categories: string[]; counts: number[] } => {
  const order: string[] = [];
  const countByCategory = new Map<string, number>();
  extractPerIssueLabels(issues, categoryFieldId).forEach((label) => {
    if (!countByCategory.has(label)) {
      order.push(label);
      countByCategory.set(label, 0);
    }
    // The label was just guaranteed to be a key above, so `get` always returns
    // a number here.
    countByCategory.set(label, (countByCategory.get(label) as number) + 1);
  });
  return {
    categories: order,
    counts: order.map((label) => countByCategory.get(label) as number),
  };
};

const checkFieldExistence = (
  fields: any[],
  idToCheck: string,
): { name: string; type: string | undefined } | undefined => {
  const targetedField = (fields ?? []).find((field) => field.id === idToCheck);
  if (!targetedField) return undefined;
  let { type } = targetedField.schema ?? {};
  // `type` can only be 'array' here if `targetedField.schema` was defined (it's
  // where `type` came from), so `.schema.items` is safe without another `?.`.
  if (type === 'array' && targetedField.schema.items) {
    type = targetedField.schema.items;
  }
  return { name: targetedField.name, type };
};

const reorderDataObjectKeys = (
  item: Record<string, any>,
  requestedFields: string[],
): Record<string, any> => {
  const reordered: Record<string, any> = {};
  requestedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(item, field)) {
      reordered[field] = item[field];
    }
  });
  return reordered;
};

const buildGridColumnsConfig = (
  data: Record<string, any>[],
  columnConfig: Record<string, (name: string) => string>,
): string => {
  // `gridtype` is always one of the fixed keys `columnConfig` declares (set
  // either by a `FieldInterface.fieldFunctions` formatter or the hardcoded
  // 'link'/'normal' fallbacks below), so the lookup is never nullish.
  const columns = data.slice(0, 1).flatMap((obj) => Object.keys(obj)
    .map((key) => columnConfig[obj[key].gridtype](obj[key].name))
    .filter(Boolean));
  return `[${columns.join(',')}]`;
};

/**
 * Reproduces the Jira-issues-to-Grid.js-table pipeline already used by
 * `addJira.ts` (field resolution via `FieldInterface.fieldFunctions` + a
 * `jiraGrid.createTable` render) for a single flat set of issues/columns, so
 * table-processor macros get the same rendering without duplicating that
 * logic wholesale. Also returns the prepared row data (index-aligned with
 * `issues`) so the caller can re-filter the table client-side without
 * re-fetching or re-deriving it.
 */
export const buildJiraGridTable = (
  issues: any[],
  columnKeys: string[],
  jiraFields: any[],
  baseUrl: string,
  gridIndex: string,
): { html: string; rows: any[][] } => {
  const requestedFields = columnKeys.filter((field) => {
    if (!/^customfield_\d+$/i.test(field)) return true;
    return Boolean(checkFieldExistence(jiraFields, field));
  });

  const { fieldFunctions } = FieldInterfaces;
  const dataObjects = (issues ?? []).map((issue) => {
    const rowData: Record<string, any> = {};
    if (requestedFields.includes('key')) {
      rowData.key = {
        data: [FieldInterfaces.createLinkObject(issue.key, baseUrl)],
        name: 'Key',
        type: 'issuelinks',
        gridtype: 'link',
      };
    }
    Object.keys(issue.fields ?? {}).forEach((fieldName) => {
      let fieldValue = issue.fields[fieldName];
      const fieldTypeData = checkFieldExistence(jiraFields, fieldName) ?? { name: fieldName, type: 'string' };
      let gridtype = '';
      if (fieldTypeData.type && fieldTypeData.type in fieldFunctions) {
        [fieldValue, gridtype] = fieldFunctions[fieldTypeData.type](fieldValue, baseUrl);
      } else {
        fieldValue = ['Type not treated'];
        gridtype = 'normal';
      }
      rowData[fieldName] = {
        data: fieldValue,
        name: fieldTypeData.name,
        type: fieldTypeData.type,
        gridtype,
      };
    });
    return rowData;
  });

  const reordered = dataObjects.map((item) => reorderDataObjectKeys(item, requestedFields));
  const preparedData = reordered.map((obj) => Object.values(obj));
  const gridjsColumns = buildGridColumnsConfig(reordered, jiraGrid.columnConfig);
  return {
    html: jiraGrid.createTable(gridIndex, gridjsColumns, preparedData),
    rows: preparedData,
  };
};
