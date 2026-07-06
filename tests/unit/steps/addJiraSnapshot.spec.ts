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
});
