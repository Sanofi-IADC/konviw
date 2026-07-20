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
    ];
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
          jira: { key: 'TRACK4-EXEC-1', fixVersions: [{ name: 'Track4 2.0.1' }] },
          testEnvironments: ['Dev'],
        },
        defects: ['TRACK4-BUG-1'],
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
      jql: 'mode = all AND fixVersions = Track4 2.0.1 AND environments = Test',
      title: 'Test execution',
      levelType: 'XRAY_TESTRUNS',
      fieldsPosition: [
        { value: { id: 'testexeckey' }, label: 'Test Execution Key' },
        { value: { id: 'status' }, label: 'Status' },
        { value: { id: 'fixversions' }, label: 'Fix versions' },
        { value: { id: 'defects' }, label: 'Defects' },
        { value: { id: 'testenvironments' }, label: 'Test Environments' },
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
    expect(html).toContain('Test execution (Total: 1)');
    expect(html).toContain('PASSED');
    expect(html).toContain('TRACK4-EXEC-1');
    expect(html).toContain('Track4 2.0.1');
    expect(html).toContain('TRACK4-BUG-1');
    expect(html).toContain('Test Environments');
    expect(html).toContain('Dev');
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
