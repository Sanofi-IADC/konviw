import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import { Step } from '../../../src/proxy-page/proxy-page.step';
import addJiraSnapshot, { getJqlVariables } from '../../../src/proxy-page/steps/addJiraSnapshot';
import { createModuleRefForStep } from './utils';

const testCaseIssue = {
  id: '20001',
  key: 'TRACK4-TEST-1',
  self: 'https://test.atlassian.net/browse/TRACK4-TEST-1',
  fields: {
    summary: 'Login works',
  },
};

class JiraServiceMock {
  async findTickets() {
    return { data: { total: 1, issues: [testCaseIssue] } };
  }

  async getFields() {
    return [
      { id: 'key', key: 'key', name: 'Key', schema: { type: 'issuelinks' } },
      { id: 'summary', key: 'summary', name: 'Summary', schema: { type: 'string' } },
      { id: 'status', key: 'status', name: 'Status', schema: { type: 'status' } },
      // A real Jira `comment` field with an unsupported type; the Xray synthetic
      // metadata must take precedence for the XRAY level so it is not rendered
      // as "Type not treated".
      { id: 'comment', key: 'comment', name: 'Comment', schema: { type: 'comments-page' } },
    ];
  }

  // eslint-disable-next-line class-methods-use-this
  async getUsersByAccountIds(accountIds: string[]) {
    const directory = {
      'account-executor': { accountId: 'account-executor', displayName: 'Alice Executor', emailAddress: 'alice@test.com', self: '' },
      'account-assignee': { accountId: 'account-assignee', displayName: 'Bob Assignee', emailAddress: 'bob@test.com', self: '' },
    };
    return (accountIds ?? []).reduce((acc, id) => {
      if (directory[id]) acc[id] = directory[id];
      return acc;
    }, {} as Record<string, any>);
  }

  // eslint-disable-next-line class-methods-use-this
  async getIssueKeysByIds(issueIds: string[]) {
    const directory = {
      '90001': 'TRACK4-BUG-1',
      '90002': 'TRACK4-BUG-2',
    };
    return (issueIds ?? []).reduce((acc, id) => {
      if (directory[id]) acc[id] = directory[id];
      return acc;
    }, {} as Record<string, string>);
  }
}

class XrayServiceMock {
  // eslint-disable-next-line class-methods-use-this
  async getTestRunsByTestIds() {
    return [
      {
        id: 'run-1',
        status: { name: 'PASSED', color: '#67AB49', description: 'Test passed' },
        test: { issueId: '20001', jira: { key: 'TRACK4-TEST-1', summary: 'Login works' } },
        testExecution: {
          issueId: '10001',
          jira: {
            key: 'TRACK4-EXEC-1',
            summary: 'Regression exec',
            status: {
              self: '', description: '', iconUrl: '', name: 'Done', id: '3', statusCategory: { self: '', id: 3, key: 'done', colorName: 'green', name: 'Done' },
            },
            fixVersions: [{ name: 'Track4 2.0.1' }],
          },
          testEnvironments: ['Staging'],
        },
        testVersion: { id: 2, name: 'v2' },
        executedById: 'account-executor',
        assigneeId: 'account-assignee',
        // Xray returns defects as raw Jira issue ids at the run level ...
        defects: ['90001'],
        comment: 'run comment',
        gherkin: 'Given a step',
        unstructured: 'do the thing',
        evidence: [{ id: 'ev1', filename: 'screenshot.png', downloadLink: 'https://files/screenshot.png' }],
        // ... and can also attach defects / evidence at the step level, which
        // must be merged into the run's Defects / Evidences columns.
        steps: [
          {
            id: 'step-1',
            defects: ['90002'],
            evidence: [{ id: 'ev2', filename: 'step-evidence.png', downloadLink: 'https://files/step.png' }],
          },
        ],
      },
    ];
  }
}

const macroParams = {
  levels: [
    {
      jql: 'project = TRACK4 AND issuetype = "Test"',
      title: 'Test Cases',
      levelType: 'JIRA_ISSUES',
      fieldsPosition: [
        { value: { id: 'key' }, label: 'Key' },
        { value: { id: 'summary' }, label: 'Summary' },
      ],
    },
    {
      jql: 'mode = all AND fixVersions = Track4 2.0.1 AND environments = Staging',
      title: 'Test execution',
      levelType: 'XRAY_TESTRUNS',
      fieldsPosition: [
        { value: { id: 'testexeckey' }, label: 'Test Execution Key' },
        { value: { id: 'testexecsummary' }, label: 'Test Execution Summary' },
        { value: { id: 'testexecstatus' }, label: 'Test Execution Status' },
        { value: { id: 'status' }, label: 'Status' },
        { value: { id: 'fixversions' }, label: 'Fix versions' },
        { value: { id: 'defects' }, label: 'Defects' },
        { value: { id: 'testkey' }, label: 'Test Key' },
        { value: { id: 'assignee' }, label: 'Assignee' },
        { value: { id: 'testrunlinkcloud' }, label: 'Link to Test Run' },
        { value: { id: 'executedby' }, label: 'Executed By' },
        { value: { id: 'testversion' }, label: 'Test Version' },
        { value: { id: 'revision' }, label: 'Revision' },
        { value: { id: 'testenvironments' }, label: 'Test Environments' },
        { value: { id: 'comment' }, label: 'Comment' },
        { value: { id: 'gherkin' }, label: 'Gherkin' },
        { value: { id: 'unstructured' }, label: 'Definition' },
        { value: { id: 'evidences' }, label: 'Evidences' },
      ],
    },
  ],
};

const buildBody = () => `<html><head><title>test</title></head><body>`
  + `<div id="Content"><div data-macro-name="jira-jql-snapshot"></div></div>`
  + `</body></html>`;

const buildStorage = () => `<ac:structured-macro ac:name="jira-jql-snapshot">`
  + `<ac:parameter ac:name="macroParams">${JSON.stringify(macroParams)}</ac:parameter>`
  + `</ac:structured-macro>`;

describe('Confluence Proxy / addJiraSnapshot / getJqlVariables', () => {
  it('extracts a bare $key that is immediately followed by more clauses', () => {
    // Regression for WEB-2475: the previous regex allowed whitespace inside the
    // captured token, so `$key AND issuetype in (...)` was read as
    // `key AND issuetype in`, breaking the parent-key substitution.
    const jql = '"Parent"=$key AND issueType in (Story, Enabler, Bug) '
      + 'AND fixVersion in ("ARM-RV2.5.0") AND status not in ("Cancelled") ORDER BY fixVersion ASC';
    expect(getJqlVariables(jql)).toBe('key');
  });

  it('extracts a bare $key that is followed by a comma (function argument form)', () => {
    expect(getJqlVariables('issue in linkedissues($key,"is tested by")')).toBe('key');
  });

  it('extracts a bare $key at the very end of the query', () => {
    expect(getJqlVariables('parent = $key')).toBe('key');
  });

  it('extracts a quoted variable name that contains spaces', () => {
    expect(getJqlVariables('"Epic Link" = $"Epic Link" ORDER BY key')).toBe('Epic Link');
  });

  it('extracts a bare custom field variable name', () => {
    expect(getJqlVariables('cf[10010] = $customfield_10010')).toBe('customfield_10010');
  });

  it('returns an empty string when the query has no variables', () => {
    expect(getJqlVariables('project = ARM AND issuetype = Bug')).toBe('');
  });
});

describe('Confluence Proxy / addJiraSnapshot', () => {
  let context: ContextService;
  let config: ConfigService;
  let step: Step;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    config = moduleRef.get<ConfigService>(ConfigService);
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'KONVIW', '123456', 'dark');
    context.setHtmlBody(buildBody());
    context.setBodyStorage(buildStorage());
    step = addJiraSnapshot(
      config,
      new JiraServiceMock() as any,
      new XrayServiceMock() as any,
    );
  });

  it('renders Xray test run data instead of the unsupported placeholder', async () => {
    await step(context);
    const html = context.getHtmlBody();

    expect(html).not.toContain('TEST RUN NOT SUPPORTED YET');
    expect(html).not.toContain('column undefined');
    expect(html).not.toContain('Type not treated');
    expect(html).toContain('Test execution (Total: 1)');
    expect(html).toContain('PASSED');
    expect(html).toContain('TRACK4-EXEC-1');
    expect(html).toContain('Track4 2.0.1');
    // Defects: raw Jira issue ids returned by Xray must be resolved to keys ...
    expect(html).toContain('TRACK4-BUG-1'); // run-level defect id 90001 -> key
    expect(html).toContain('TRACK4-BUG-2'); // step-level defect id 90002 -> key (merged)
    // ... and the raw numeric ids must not be shown.
    expect(html).not.toContain('90001');
    expect(html).not.toContain('90002');
    expect(html).toContain('Test Environments');
    expect(html).toContain('Staging');
    // New columns fixed as part of WEB-2475 Kevin feedback.
    expect(html).toContain('Regression exec'); // testexecsummary
    expect(html).toContain('Alice Executor'); // executedby resolved to name
    expect(html).toContain('Bob Assignee'); // assignee resolved to name
    expect(html).toContain('v2'); // testversion
    expect(html).toContain('run comment'); // comment via synthetic string field
    expect(html).toContain('screenshot.png'); // run-level evidence
    expect(html).toContain('step-evidence.png'); // step-level evidence (merged)
    // Evidence links must go through konviw's Xray attachment proxy, not the
    // raw (unauthenticated, 404-ing) Xray downloadLink.
    expect(html).toContain('/api/xray/attachments/ev1');
    expect(html).toContain('/api/xray/attachments/ev2'); // step-level evidence proxied too
    expect(html).not.toContain('https://files/screenshot.png');
    // Image evidence is displayed inline as a thumbnail: the evidences column
    // uses the image formatter (the grid renders the <img> client-side from the
    // proxied link in the row data).
    expect(html).toContain('class="xray-evidence-thumb"');
    // Clicking a thumbnail opens the lightbox modal rather than navigating.
    expect(html).toContain('xray-evidence-modal');
    expect(html).toContain('Given a step'); // gherkin
    // account ids should not leak into the rendered output
    expect(html).not.toContain('account-executor');
    expect(html).not.toContain('account-assignee');
  });

  it('degrades gracefully when the Xray service is not provided', async () => {
    const stepWithoutXray = addJiraSnapshot(config, new JiraServiceMock() as any);
    await stepWithoutXray(context);
    const html = context.getHtmlBody();

    expect(html).not.toContain('TEST RUN NOT SUPPORTED YET');
    expect(html).toContain('Test execution (Total: 0)');
  });

  it('resolves a bare $key variable per parent in a child JIRA_ISSUES level', async () => {
    const parentEpics = [
      {
        id: '10000',
        key: 'ARM-454',
        self: 'https://test.atlassian.net/browse/ARM-454',
        fields: { summary: 'Confluence Workflows' },
      },
      {
        id: '10001',
        key: 'ARM-2971',
        self: 'https://test.atlassian.net/browse/ARM-2971',
        fields: { summary: 'iShift regulated model' },
      },
    ];
    // Each parent resolves to its own child issues, keyed by the substituted JQL.
    const childrenByParent: Record<string, any[]> = {
      'ARM-454': [
        {
          id: '20001',
          key: 'ARM-3438',
          self: 'https://test.atlassian.net/browse/ARM-3438',
          fields: { summary: 'Update regulated model' },
        },
      ],
      'ARM-2971': [
        {
          id: '20002',
          key: 'ARM-3439',
          self: 'https://test.atlassian.net/browse/ARM-3439',
          fields: { summary: 'Automations / Integrations' },
        },
        {
          id: '20003',
          key: 'ARM-3440',
          self: 'https://test.atlassian.net/browse/ARM-3440',
          fields: { summary: 'Issue workflows config' },
        },
      ],
    };

    const receivedJqls: string[] = [];
    class ChildLevelJiraServiceMock {
      // eslint-disable-next-line class-methods-use-this
      async findTickets(_server: string, jql: string) {
        receivedJqls.push(jql);
        if (jql.includes('issuetype in (Epic)')) {
          return { data: { total: parentEpics.length, issues: parentEpics } };
        }
        // The child query must have had its `$key` replaced by the parent key.
        const match = jql.match(/"Parent"=(\S+)/);
        const issues = match ? childrenByParent[match[1]] ?? [] : [];
        return { data: { total: issues.length, issues } };
      }

      // eslint-disable-next-line class-methods-use-this
      async getFields() {
        return [
          { id: 'key', key: 'key', name: 'Key', schema: { type: 'issuelinks' } },
          { id: 'summary', key: 'summary', name: 'Summary', schema: { type: 'string' } },
        ];
      }
    }

    const childMacroParams = {
      levels: [
        {
          jql: 'project = "ARM" AND issuetype in (Epic) ORDER BY component ASC',
          title: 'Epics',
          levelType: 'JIRA_ISSUES',
          fieldsPosition: [
            { value: { id: 'key' }, label: 'Key' },
            { value: { id: 'summary' }, label: 'Summary' },
          ],
        },
        {
          jql: '"Parent"=$key AND issueType in (Story, Enabler, Bug) ORDER BY fixVersion ASC',
          title: '',
          levelType: 'JIRA_ISSUES',
          fieldsPosition: [
            { value: { id: 'key' }, label: 'Key' },
            { value: { id: 'summary' }, label: 'Summary' },
          ],
        },
      ],
    };

    context.setBodyStorage(
      '<ac:structured-macro ac:name="jira-jql-snapshot">'
        + `<ac:parameter ac:name="macroParams">${JSON.stringify(childMacroParams)}</ac:parameter>`
        + '</ac:structured-macro>',
    );

    const childStep = addJiraSnapshot(config, new ChildLevelJiraServiceMock() as any);
    await childStep(context);
    const html = context.getHtmlBody();

    // Every parent key is substituted into its own child query (no clause is swallowed).
    expect(receivedJqls).toContain('"Parent"=ARM-454 AND issueType in (Story, Enabler, Bug) ORDER BY fixVersion ASC');
    expect(receivedJqls).toContain('"Parent"=ARM-2971 AND issueType in (Story, Enabler, Bug) ORDER BY fixVersion ASC');
    // Child level total aggregates every parent's children (1 + 2 = 3).
    expect(html).toContain('(Total: 3)');
    expect(html).toContain('ARM-3438');
    expect(html).toContain('ARM-3439');
    expect(html).toContain('ARM-3440');
  });
});
