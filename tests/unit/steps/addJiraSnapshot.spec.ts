import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import { Step } from '../../../src/proxy-page/proxy-page.step';
import addJiraSnapshot from '../../../src/proxy-page/steps/addJiraSnapshot';
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
        defects: ['TRACK4-BUG-1'],
        comment: 'run comment',
        gherkin: 'Given a step',
        unstructured: 'do the thing',
        evidence: [{ id: 'ev1', filename: 'screenshot.png', downloadLink: 'https://files/screenshot.png' }],
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
    expect(html).toContain('TRACK4-BUG-1');
    expect(html).toContain('Test Environments');
    expect(html).toContain('Staging');
    // New columns fixed as part of WEB-2475 Kevin feedback.
    expect(html).toContain('Regression exec'); // testexecsummary
    expect(html).toContain('Alice Executor'); // executedby resolved to name
    expect(html).toContain('Bob Assignee'); // assignee resolved to name
    expect(html).toContain('v2'); // testversion
    expect(html).toContain('run comment'); // comment via synthetic string field
    expect(html).toContain('screenshot.png'); // evidences
    // Evidence links must go through konviw's Xray attachment proxy, not the
    // raw (unauthenticated, 404-ing) Xray downloadLink.
    expect(html).toContain('/api/xray/attachments/ev1');
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
});
