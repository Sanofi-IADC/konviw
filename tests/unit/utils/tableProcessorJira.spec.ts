import * as cheerio from 'cheerio';
import {
  parseSerializedTree,
  findChartNodes,
  extractJiraDatasource,
  resolveFieldId,
  extractGroupLabel,
  extractPerIssueLabels,
  distinctSortedLabels,
  aggregateByCategory,
  buildJiraGridTable,
  TableProcessorNode,
} from '../../../src/proxy-page/utils/tableProcessorJira';

describe('tableProcessorJira / parseSerializedTree', () => {
  it('returns null for empty/falsy input', () => {
    expect(parseSerializedTree('')).toBeNull();
    expect(parseSerializedTree(undefined as unknown as string)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseSerializedTree('{not json')).toBeNull();
  });

  it('parses a plain object tree', () => {
    const tree = parseSerializedTree('{"type":"filter","params":{}}');
    expect(tree).toEqual({ type: 'filter', params: {} });
  });

  it('takes the first element when the root is an array', () => {
    const tree = parseSerializedTree('[{"type":"filter"},{"type":"chart"}]');
    expect(tree).toEqual({ type: 'filter' });
  });

  it('returns null when the parsed JSON is itself null', () => {
    expect(parseSerializedTree('null')).toBeNull();
  });
});

describe('tableProcessorJira / findChartNodes', () => {
  it('returns an empty array for a null root', () => {
    expect(findChartNodes(null)).toEqual([]);
  });

  it('returns the root itself when it is a chart node', () => {
    const root: TableProcessorNode = { type: 'chart', params: { column: 'X' } };
    expect(findChartNodes(root)).toEqual([root]);
  });

  it('returns an empty array when no node in the tree is a chart', () => {
    const root: TableProcessorNode = { type: 'filter', child: [{ type: 'pivot' }] };
    expect(findChartNodes(root)).toEqual([]);
  });

  it('collects every chart node found anywhere in a nested tree', () => {
    const chartA: TableProcessorNode = { type: 'chart', params: { column: 'A' } };
    const chartB: TableProcessorNode = { type: 'chart', params: { column: 'B' } };
    const root: TableProcessorNode = {
      type: 'filter',
      child: [
        { type: 'pivot', child: [chartA] },
        chartB,
      ],
    };
    expect(findChartNodes(root)).toEqual(expect.arrayContaining([chartA, chartB]));
    expect(findChartNodes(root)).toHaveLength(2);
  });

  it('tolerates nodes with no child property', () => {
    const root: TableProcessorNode = { type: 'chart' };
    expect(findChartNodes(root)).toEqual([root]);
  });

  it('skips falsy entries in a child array', () => {
    const root: TableProcessorNode = { type: 'filter', child: [null as unknown as TableProcessorNode] };
    expect(findChartNodes(root)).toEqual([]);
  });
});

const loadRichTextBody = (innerHtml: string) => {
  const $xml = cheerio.load(
    `<ac:rich-text-body>${innerHtml}</ac:rich-text-body>`,
    { xmlMode: true },
  );
  const richTextBody = $xml('ac\\:rich-text-body').get(0);
  return { $xml, richTextBody };
};

describe('tableProcessorJira / extractJiraDatasource', () => {
  it('returns null when there is no data-datasource anchor', () => {
    const { $xml, richTextBody } = loadRichTextBody('<p>no card here</p>');
    expect(extractJiraDatasource($xml, richTextBody)).toBeNull();
  });

  it('returns null when the data-datasource attribute is not valid JSON', () => {
    const { $xml, richTextBody } = loadRichTextBody('<a data-datasource="{not json">link</a>');
    expect(extractJiraDatasource($xml, richTextBody)).toBeNull();
  });

  it('returns null when the JSON has no jql', () => {
    const datasource = JSON.stringify({ parameters: {}, views: [{ properties: { columns: [{ key: 'key' }] } }] });
    const { $xml, richTextBody } = loadRichTextBody(`<a data-datasource='${datasource}'>link</a>`);
    expect(extractJiraDatasource($xml, richTextBody)).toBeNull();
  });

  it('returns null when views/columns are missing', () => {
    const datasource = JSON.stringify({ parameters: { jql: 'project = X' } });
    const { $xml, richTextBody } = loadRichTextBody(`<a data-datasource='${datasource}'>link</a>`);
    expect(extractJiraDatasource($xml, richTextBody)).toBeNull();
  });

  it('returns null when the "parameters" object is entirely absent', () => {
    const datasource = JSON.stringify({ views: [{ properties: { columns: [{ key: 'key' }] } }] });
    const { $xml, richTextBody } = loadRichTextBody(`<a data-datasource='${datasource}'>link</a>`);
    expect(extractJiraDatasource($xml, richTextBody)).toBeNull();
  });

  it('returns null when every column key is falsy or the column itself is null', () => {
    const datasource = JSON.stringify({
      parameters: { jql: 'project = X' },
      views: [{ properties: { columns: [{}, { key: '' }, null] } }],
    });
    const { $xml, richTextBody } = loadRichTextBody(`<a data-datasource='${datasource}'>link</a>`);
    expect(extractJiraDatasource($xml, richTextBody)).toBeNull();
  });

  it('returns null when the data-datasource JSON parses to null', () => {
    const { $xml, richTextBody } = loadRichTextBody('<a data-datasource="null">link</a>');
    expect(extractJiraDatasource($xml, richTextBody)).toBeNull();
  });

  it('extracts the jql and column keys from a well-formed datasource card', () => {
    const datasource = JSON.stringify({
      parameters: { jql: 'project in (BOIP) ORDER BY created DESC' },
      views: [{ type: 'table', properties: { columns: [{ key: 'issuetype' }, { key: 'key' }, { key: 'customfield_123' }] } }],
    });
    const { $xml, richTextBody } = loadRichTextBody(`<a data-datasource='${datasource}'>link</a>`);
    expect(extractJiraDatasource($xml, richTextBody)).toEqual({
      jql: 'project in (BOIP) ORDER BY created DESC',
      columnKeys: ['issuetype', 'key', 'customfield_123'],
    });
  });
});

describe('tableProcessorJira / resolveFieldId', () => {
  const jiraFields = [
    { id: 'customfield_111', name: 'Submitted month' },
    { id: 'status', name: 'Status' },
  ];

  it('returns undefined for a falsy label', () => {
    expect(resolveFieldId('', jiraFields)).toBeUndefined();
    expect(resolveFieldId(undefined as unknown as string, jiraFields)).toBeUndefined();
  });

  it('returns undefined when no field matches', () => {
    expect(resolveFieldId('Not A Field', jiraFields)).toBeUndefined();
  });

  it('matches case-insensitively and ignores surrounding whitespace', () => {
    expect(resolveFieldId('  submitted MONTH  ', jiraFields)).toBe('customfield_111');
  });

  it('tolerates a missing/undefined fields list', () => {
    expect(resolveFieldId('Status', undefined as unknown as any[])).toBeUndefined();
  });

  it('tolerates a null/nameless entry in the fields list', () => {
    const fieldsWithGaps = [null, { id: 'status' }, ...jiraFields] as unknown as any[];
    expect(resolveFieldId('Status', fieldsWithGaps)).toBe('status');
  });
});

describe('tableProcessorJira / extractGroupLabel', () => {
  it('returns an empty string for null/undefined', () => {
    expect(extractGroupLabel(null)).toBe('');
    expect(extractGroupLabel(undefined)).toBe('');
  });

  it('stringifies plain scalars', () => {
    expect(extractGroupLabel('Backlog')).toBe('Backlog');
    expect(extractGroupLabel(42)).toBe('42');
  });

  it('formats a JSON-encoded {start,end} date-range string as its start month/year (a "Submitted month"-style field)', () => {
    expect(extractGroupLabel('{"start":"2026-07-01","end":"2026-07-31"}')).toBe('Jul 2026');
  });

  it('falls back to the raw string for {start,...}-shaped JSON with an unparseable date', () => {
    expect(extractGroupLabel('{"start":"not-a-date","end":"2026-07-31"}')).toBe('{"start":"not-a-date","end":"2026-07-31"}');
  });

  it('falls back to the raw string when "start" is present but not a string', () => {
    const raw = '{"start":123,"end":"2026-07-31"}';
    expect(extractGroupLabel(raw)).toBe(raw);
  });

  it('falls back to the raw string for malformed JSON that merely starts with "{" and mentions "start"', () => {
    expect(extractGroupLabel('{"start": not valid json')).toBe('{"start": not valid json');
  });

  it('falls back to the raw string for a "{"-prefixed string with no "start" key', () => {
    expect(extractGroupLabel('{"foo":"bar"}')).toBe('{"foo":"bar"}');
  });

  it('does not attempt date-range parsing for strings that do not start with "{"', () => {
    expect(extractGroupLabel('"start":"2026-07-01"')).toBe('"start":"2026-07-01"');
  });

  it('reads .value off an option-shaped object', () => {
    expect(extractGroupLabel({ value: 'Service Category' })).toBe('Service Category');
  });

  it('reads .name off a user/status/component-shaped object when there is no .value', () => {
    expect(extractGroupLabel({ name: 'Done' })).toBe('Done');
  });

  it('returns an empty string for an object with neither .value nor .name', () => {
    expect(extractGroupLabel({ start: '2026-01-01', end: '2026-02-01' })).toBe('');
  });

  it('joins array values, dropping empty entries', () => {
    expect(extractGroupLabel([{ name: 'A' }, {}, { value: 'B' }])).toBe('A, B');
  });
});

describe('tableProcessorJira / aggregateByCategory', () => {
  it('returns empty categories/counts for no issues', () => {
    expect(aggregateByCategory([], 'status')).toEqual({ categories: [], counts: [] });
  });

  it('groups issues by category label, preserving first-seen order', () => {
    const issues = [
      { fields: { status: { name: 'Open' } } },
      { fields: { status: { name: 'Done' } } },
      { fields: { status: { name: 'Open' } } },
    ];
    expect(aggregateByCategory(issues, 'status')).toEqual({
      categories: ['Open', 'Done'],
      counts: [2, 1],
    });
  });

  it('buckets issues with a missing/unlabelable field value under "Unspecified"', () => {
    const issues = [{ fields: { status: null } }, { fields: {} }];
    expect(aggregateByCategory(issues, 'status')).toEqual({
      categories: ['Unspecified'],
      counts: [2],
    });
  });

  it('tolerates a null/undefined issues list', () => {
    expect(aggregateByCategory(null as unknown as any[], 'status')).toEqual({ categories: [], counts: [] });
    expect(aggregateByCategory(undefined as unknown as any[], 'status')).toEqual({ categories: [], counts: [] });
  });

  it('tolerates a null issue entry and an issue with no fields object at all', () => {
    const issues = [null as unknown as { fields: any }, {} as { fields: any }];
    expect(aggregateByCategory(issues, 'status')).toEqual({
      categories: ['Unspecified'],
      counts: [2],
    });
  });
});

describe('tableProcessorJira / extractPerIssueLabels', () => {
  it('returns one label per issue, in fetch order, defaulting unlabelable values to "Unspecified"', () => {
    const issues = [
      { fields: { status: { name: 'Open' } } },
      { fields: { status: null } },
      { fields: { status: { name: 'Done' } } },
    ];
    expect(extractPerIssueLabels(issues, 'status')).toEqual(['Open', 'Unspecified', 'Done']);
  });

  it('tolerates a null/undefined issues list', () => {
    expect(extractPerIssueLabels(null as unknown as any[], 'status')).toEqual([]);
  });
});

describe('tableProcessorJira / distinctSortedLabels', () => {
  it('deduplicates and alphabetically sorts the given labels', () => {
    expect(distinctSortedLabels(['Open', 'Done', 'Open', 'Backlog'])).toEqual(['Backlog', 'Done', 'Open']);
  });

  it('returns an empty array for an empty input', () => {
    expect(distinctSortedLabels([])).toEqual([]);
  });
});

describe('tableProcessorJira / buildJiraGridTable', () => {
  const jiraFields = [
    { id: 'status', name: 'Status', schema: { type: 'status' } },
    { id: 'customfield_999', name: 'Known Field', schema: { type: 'string' } },
    { id: 'labels', name: 'Labels', schema: { type: 'array', items: 'string' } },
  ];

  const issues = [
    {
      key: 'FND-1',
      fields: {
        status: {
          self: '',
          description: '',
          iconUrl: '',
          name: 'Done',
          id: '3',
          statusCategory: {
            self: '', id: 3, key: 'done', colorName: 'green', name: 'Done',
          },
        },
        customfield_999: 'hello',
        labels: ['a', 'b'],
        unknownField: 'raw',
      },
    },
  ];

  it('drops unresolved internal customfield_ columns but keeps regular columns like key', () => {
    const { html } = buildJiraGridTable(issues, ['key', 'status', 'customfield_404'], jiraFields, 'https://x.atlassian.net', 'tp-0');
    expect(html).toContain('id="gridjstp-0"');
    // customfield_404 has no matching jiraFields entry, so it must not appear as a rendered column.
    expect(html).not.toContain('customfield_404');
  });

  it('builds a Key column using createLinkObject when "key" is requested', () => {
    const { html, rows } = buildJiraGridTable(issues, ['key'], jiraFields, 'https://x.atlassian.net', 'tp-1');
    expect(html).toContain('https://x.atlassian.net/browse/FND-1?src=confmacro');
    // `rows` is index-aligned with `issues` and reused by the caller to
    // re-filter the table client-side without re-deriving it.
    expect(rows).toHaveLength(1);
  });

  it('resolves a known field type through fieldFunctions (status)', () => {
    const { html } = buildJiraGridTable(issues, ['status'], jiraFields, 'https://x.atlassian.net', 'tp-2');
    expect(html).toContain('Done');
  });

  it('resolves an array-schema field via its item type (labels: array of string)', () => {
    const { html } = buildJiraGridTable(issues, ['labels'], jiraFields, 'https://x.atlassian.net', 'tp-3');
    expect(html).toContain('"a"');
    expect(html).toContain('"b"');
  });

  it('falls back to "Type not treated" for a field with no resolvable formatter', () => {
    const unresolvedFields = [{ id: 'weird', name: 'Weird', schema: { type: 'not-a-real-type' } }];
    const weirdIssues = [{ key: 'FND-2', fields: { weird: 'value' } }];
    const { html } = buildJiraGridTable(weirdIssues, ['weird'], unresolvedFields, 'https://x.atlassian.net', 'tp-4');
    expect(html).toContain('Type not treated');
  });

  it('treats an unresolved field id as a plain string column', () => {
    const { html } = buildJiraGridTable(issues, ['unknownField'], [], 'https://x.atlassian.net', 'tp-5');
    expect(html).toContain('raw');
  });

  it('renders an empty grid without throwing when there are no issues', () => {
    const { html } = buildJiraGridTable([], ['key'], jiraFields, 'https://x.atlassian.net', 'tp-6');
    expect(html).toContain('id="gridjstp-6"');
    expect(html).toContain('data: []');
  });

  it('tolerates a null/undefined jiraFields list', () => {
    const { html } = buildJiraGridTable(
      [{ key: 'FND-4', fields: { unknownField: 'raw' } }],
      ['unknownField'],
      null as unknown as any[],
      'https://x.atlassian.net',
      'tp-10',
    );
    expect(html).toContain('raw');
  });

  it('tolerates a null/undefined issues list and issues with no fields object', () => {
    expect(() => buildJiraGridTable(null as unknown as any[], ['key'], jiraFields, 'https://x.atlassian.net', 'tp-7')).not.toThrow();
    const { html } = buildJiraGridTable([{ key: 'FND-9' }], ['key'], jiraFields, 'https://x.atlassian.net', 'tp-8');
    expect(html).toContain('FND-9');
  });

  it('tolerates a field with no schema and an array-typed field with no declared item type', () => {
    const noSchemaFields = [
      { id: 'noschema', name: 'No Schema' },
      { id: 'arraynoitems', name: 'Array No Items', schema: { type: 'array' } },
    ];
    const rows = [{ key: 'FND-3', fields: { noschema: 'plain', arraynoitems: ['x'] } }];
    const { html } = buildJiraGridTable(rows, ['noschema', 'arraynoitems'], noSchemaFields, 'https://x.atlassian.net', 'tp-9');
    // Neither 'undefined' (no schema) nor 'array' (unresolved item type) are in
    // fieldFunctions, so both columns fall back to the "Type not treated" formatter.
    expect(html).toContain('Type not treated');
  });
});
