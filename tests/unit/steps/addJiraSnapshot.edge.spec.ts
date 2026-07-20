import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import { Step } from '../../../src/proxy-page/proxy-page.step';
import addJiraSnapshot from '../../../src/proxy-page/steps/addJiraSnapshot';
import { createModuleRefForStep } from './utils';

// A JiraService test double whose `findTickets` resolves issues from the JQL so
// we can build multi-parent hierarchies (each parent gets its own query).
class ConfigurableJiraServiceMock {
  private readonly resolve: (jql: string) => any[];

  private readonly directory: Record<string, any>;

  constructor(resolve: (jql: string) => any[], directory: Record<string, any> = {}) {
    this.resolve = resolve;
    this.directory = directory;
  }

  async findTickets(_project: string, jql: string) {
    return { data: { total: 0, issues: this.resolve(jql) } };
  }

  // eslint-disable-next-line class-methods-use-this
  async getFields() {
    return [
      { id: 'key', key: 'key', name: 'Key', schema: { type: 'issuelinks' } },
      { id: 'summary', key: 'summary', name: 'Summary', schema: { type: 'string' } },
      { id: 'status', key: 'status', name: 'Status', schema: { type: 'status' } },
    ];
  }

  async getUsersByAccountIds(accountIds: string[]) {
    return (accountIds ?? []).reduce((acc, id) => {
      if (this.directory[id]) acc[id] = this.directory[id];
      return acc;
    }, {} as Record<string, any>);
  }

  // Resolves defect Jira issue ids to keys via the same `directory` map (values
  // that are strings are treated as keys); unknown ids are left unresolved.
  async getIssueKeysByIds(issueIds: string[]) {
    return (issueIds ?? []).reduce((acc, id) => {
      if (typeof this.directory[id] === 'string') acc[id] = this.directory[id];
      return acc;
    }, {} as Record<string, string>);
  }
}

class ConfigurableXrayServiceMock {
  private readonly runs: any[];

  constructor(runs: any[]) {
    this.runs = runs;
  }

  async getTestRunsByTestIds(testIds: string[]) {
    return this.runs.filter((run) => testIds.includes(run?.test?.issueId));
  }
}

const epicLevel = (fieldsPosition: any[]) => ({
  jql: 'project = ARM AND issuetype = Epic',
  title: 'Epics',
  levelType: 'JIRA_ISSUES',
  fieldsPosition,
});

const buildBody = () => '<html><head><title>test</title></head><body>'
  + '<div id="Content"><div data-macro-name="jira-jql-snapshot"></div></div>'
  + '</body></html>';

const buildStorage = (macroParams: any) => '<ac:structured-macro ac:name="jira-jql-snapshot">'
  + `<ac:parameter ac:name="macroParams">${JSON.stringify(macroParams)}</ac:parameter>`
  + '</ac:structured-macro>';

// Pulls the `data: [...]` array that the step serialises into the grid script
// so we can assert on the actual rows (and their parent/child pairing).
const extractGridData = (html: string): any[][] => {
  const match = html.match(/data:\s*(\[[\s\S]*\]),\s*resizable: true/);
  if (!match) return [];
  return JSON.parse(match[1]);
};

const rowText = (row: any[]): string => JSON.stringify(row);

describe('Confluence Proxy / addJiraSnapshot (edge cases)', () => {
  let context: ContextService;
  let config: ConfigService;

  const runStep = async (step: Step) => {
    await step(context);
    return context.getHtmlBody();
  };

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    config = moduleRef.get<ConfigService>(ConfigService);
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'KONVIW', '123456', 'dark');
    context.setHtmlBody(buildBody());
  });

  it('aligns Xray runs with the correct parent across multiple epics', async () => {
    const macroParams = {
      levels: [
        epicLevel([
          { value: { id: 'key' }, label: 'Key' },
          { value: { id: 'summary' }, label: 'Summary' },
        ]),
        {
          jql: '"Epic Link" = $key',
          title: 'Tests',
          levelType: 'JIRA_ISSUES',
          fieldsPosition: [
            { value: { id: 'key' }, label: 'Key' },
            { value: { id: 'summary' }, label: 'Summary' },
          ],
        },
        {
          jql: 'mode = all',
          title: 'Test execution',
          levelType: 'XRAY_TESTRUNS',
          fieldsPosition: [
            { value: { id: 'testexeckey' }, label: 'Test Execution Key' },
            { value: { id: 'status' }, label: 'Status' },
          ],
        },
      ],
    };
    context.setBodyStorage(buildStorage(macroParams));

    const jira = new ConfigurableJiraServiceMock((jql) => {
      if (jql.includes('EPIC-1')) {
        return [{ id: '101', key: 'TEST-1', fields: { summary: 'Test One' } }];
      }
      if (jql.includes('EPIC-2')) {
        return [{ id: '201', key: 'TEST-2', fields: { summary: 'Test Two' } }];
      }
      return [
        { id: '1', key: 'EPIC-1', fields: { summary: 'Epic One' } },
        { id: '2', key: 'EPIC-2', fields: { summary: 'Epic Two' } },
      ];
    });
    const xray = new ConfigurableXrayServiceMock([
      { id: 'r1', status: { name: 'PASSED', color: '#67AB49' }, test: { issueId: '101', jira: { key: 'TEST-1' } }, testExecution: { issueId: '1001', jira: { key: 'EXEC-1' } } },
      { id: 'r2', status: { name: 'FAILED', color: '#E5493A' }, test: { issueId: '201', jira: { key: 'TEST-2' } }, testExecution: { issueId: '2002', jira: { key: 'EXEC-2' } } },
    ]);

    const html = await runStep(addJiraSnapshot(config, jira as any, xray as any));
    const rows = extractGridData(html);

    // Two leaf rows, one per epic->test->execution path.
    expect(rows).toHaveLength(2);
    const test1Row = rows.find((r) => rowText(r).includes('TEST-1'));
    const test2Row = rows.find((r) => rowText(r).includes('TEST-2'));
    // The key regression: each test must carry its OWN execution, not the first
    // test's execution leaking onto the second epic.
    expect(rowText(test1Row)).toContain('EXEC-1');
    expect(rowText(test1Row)).not.toContain('EXEC-2');
    expect(rowText(test2Row)).toContain('EXEC-2');
    expect(rowText(test2Row)).not.toContain('EXEC-1');
    expect(html).toContain('PASSED');
    expect(html).toContain('FAILED');
  });

  const singleLevelMacro = (xrayJql: string) => ({
    levels: [
      epicLevel([{ value: { id: 'key' }, label: 'Key' }]),
      {
        jql: xrayJql,
        title: 'Test execution',
        levelType: 'XRAY_TESTRUNS',
        fieldsPosition: [
          { value: { id: 'testexeckey' }, label: 'Test Execution Key' },
          { value: { id: 'executedby' }, label: 'Executed By' },
        ],
      },
    ],
  });

  const singleTestResolver = (jql: string) => {
    if (jql.includes('issuetype = Epic')) {
      return [{ id: '101', key: 'TEST-1', fields: { summary: 'Test One' } }];
    }
    return [];
  };

  it('falls back to the raw account id when a user cannot be resolved', async () => {
    context.setBodyStorage(buildStorage(singleLevelMacro('mode = all')));
    const jira = new ConfigurableJiraServiceMock(singleTestResolver, {}); // empty directory
    const xray = new ConfigurableXrayServiceMock([
      { id: 'r1', test: { issueId: '101', jira: { key: 'TEST-1' } }, testExecution: { issueId: '1001', jira: { key: 'EXEC-1' } }, executedById: 'ghost-account-id' },
    ]);

    const html = await runStep(addJiraSnapshot(config, jira as any, xray as any));

    // Unresolved users still surface (raw id) rather than a silently empty cell.
    expect(html).toContain('ghost-account-id');
    expect(html).toContain('EXEC-1');
  });

  it('excludes runs that do not match the fix version in the level JQL', async () => {
    context.setBodyStorage(buildStorage(singleLevelMacro('mode = all AND fixVersions = 2.0.0')));
    const jira = new ConfigurableJiraServiceMock(singleTestResolver);
    const xray = new ConfigurableXrayServiceMock([
      { id: 'r1', test: { issueId: '101', jira: { key: 'TEST-1' } }, testExecution: { issueId: '1001', jira: { key: 'EXEC-1', fixVersions: [{ name: '1.0.0' }] } } },
    ]);

    const html = await runStep(addJiraSnapshot(config, jira as any, xray as any));

    expect(html).not.toContain('EXEC-1');
    expect(html).toContain('Test execution (Total: 0)');
  });

  it('excludes runs that do not match the environment in the level JQL', async () => {
    context.setBodyStorage(buildStorage(singleLevelMacro('mode = all AND environments = Prod')));
    const jira = new ConfigurableJiraServiceMock(singleTestResolver);
    const xray = new ConfigurableXrayServiceMock([
      { id: 'r1', test: { issueId: '101', jira: { key: 'TEST-1' } }, testExecution: { issueId: '1001', jira: { key: 'EXEC-1' }, testEnvironments: ['Dev'] } },
    ]);

    const html = await runStep(addJiraSnapshot(config, jira as any, xray as any));

    expect(html).not.toContain('EXEC-1');
    expect(html).toContain('Test execution (Total: 0)');
  });

  it('inherits the fix version scope from an ancestor (parent) level query', async () => {
    // The release fix versions live in the parent (Epic) query, while the XRAY
    // level query only carries a status filter - konviw must still scope the
    // runs to those versions (regression: historical runs leaked in otherwise).
    const macroParams = {
      levels: [
        {
          jql: 'project = ARM AND issuetype = Epic AND fixVersion in ("RV2.8.0")',
          title: 'Epics',
          levelType: 'JIRA_ISSUES',
          fieldsPosition: [{ value: { id: 'key' }, label: 'Key' }],
        },
        {
          jql: 'Status != Cancelled',
          title: 'Test execution',
          levelType: 'XRAY_TESTRUNS',
          fieldsPosition: [{ value: { id: 'testexeckey' }, label: 'Test Execution Key' }],
        },
      ],
    };
    context.setBodyStorage(buildStorage(macroParams));
    const jira = new ConfigurableJiraServiceMock(singleTestResolver);
    const xray = new ConfigurableXrayServiceMock([
      { id: 'r1', test: { issueId: '101', jira: { key: 'TEST-1' } }, testExecution: { issueId: '1001', jira: { key: 'EXEC-REL', fixVersions: [{ name: 'RV2.8.0' }] } } },
      { id: 'r2', test: { issueId: '101', jira: { key: 'TEST-1' } }, testExecution: { issueId: '1002', jira: { key: 'EXEC-OLD', fixVersions: [{ name: 'RV1.0.0' }] } } },
    ]);

    const html = await runStep(addJiraSnapshot(config, jira as any, xray as any));

    expect(html).toContain('EXEC-REL');
    expect(html).not.toContain('EXEC-OLD');
    expect(html).toContain('Test execution (Total: 1)');
  });

  it('excludes runs whose Test Execution status matches the level Status filter', async () => {
    context.setBodyStorage(buildStorage(singleLevelMacro('Status != Cancelled')));
    const jira = new ConfigurableJiraServiceMock(singleTestResolver);
    const xray = new ConfigurableXrayServiceMock([
      { id: 'r1', test: { issueId: '101', jira: { key: 'TEST-1' } }, testExecution: { issueId: '1001', jira: { key: 'EXEC-KEEP', status: { name: 'Done' } } } },
      { id: 'r2', test: { issueId: '101', jira: { key: 'TEST-1' } }, testExecution: { issueId: '1002', jira: { key: 'EXEC-DROP', status: { name: 'Cancelled' } } } },
    ]);

    const html = await runStep(addJiraSnapshot(config, jira as any, xray as any));

    expect(html).toContain('EXEC-KEEP');
    expect(html).not.toContain('EXEC-DROP');
    expect(html).toContain('Test execution (Total: 1)');
  });
});
