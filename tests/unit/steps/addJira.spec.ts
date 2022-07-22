import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import { Step } from '../../../src/proxy-page/proxy-page.step';
import addJira from '../../../src/proxy-page/steps/addJira';
import { createModuleRefForStep } from './utils';
import { JiraService } from '../../../src/jira/jira.service';

const mockedIssueData = {
  expand:
    'operations,versionedRepresentations,editmeta,changelog,renderedFields',
  id: 'id',
  self: 'link',
  key: 'FND-319',
  fields: {
    summary: 'Awesome Summary',
    issuetype: { name: 'issue', iconUrl: 'image.png' },
    assignee: { displayName: 'an assignee' },
    priority: { name: 'low', iconUrl: 'image.png' },
    resolution: { name: 'resolved' },
    status: { name: 'a status', statusCategory: { color: 'green' } },
  },
};

class JiraServiceMock {
  async getTicket(key: string) {
    return mockedIssueData;
  }
  async findTickets() {
    return {
      issues: [mockedIssueData],
    };
  }
}

describe('Confluence Proxy / addJira', () => {
  let context: ContextService;
  let config: ConfigService;
  let step: Step;
  const OLD_ENV = process.env;

  beforeEach(async () => {
    jest.resetModules(); // it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
    const moduleRef = await createModuleRefForStep();
    config = moduleRef.get<ConfigService>(ConfigService);
    process.env['CPV_JIRA_System_JIRA_BASE_URL'] =
      config.get('confluence.baseURL');
    step = addJira(config, new JiraServiceMock() as any);
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('XXX', '123456', 'dark');
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should add the jira grid', async () => {
    const cheerioBody = `<input
      type="hidden"
      class="refresh-wiki"
      id="refresh-wiki-1366834209"
      data-wikimarkup='
        <ac:structured-macro ac:name="jira" ac:schema-version="1" ac:macro-id="macro-id">
        <ac:parameter ac:name="server">System JIRA</ac:parameter>
        <ac:parameter ac:name="maximumIssues">100</ac:parameter>
        <ac:parameter ac:name="columns">key,summary,type,assignee,priority,status,resolution</ac:parameter>
        <ac:parameter ac:name="jqlQuery">project = FND AND "Epic Link" = FND-303 ORDER BY resolution DESC, priority </ac:parameter>
        <ac:parameter ac:name="serverId">server-id</ac:parameter>
        <ac:parameter ac:name=": = | RAW | = :">server=System JIRA|maximumIssues=100|columns=key,summary,type,assignee,priority,status,resolution|jqlQuery=project = FND AND "Epic Link" = FND-303 ORDER BY resolution DESC, priority |serverId=server-id</ac:parameter>
        <ac:parameter ac:name=": = | TOKEN_TYPE | = :">BLOCK</ac:parameter>
        </ac:structured-macro>' data-pageid="page-id">`;

    context.setHtmlBody(
      `<html><head><title>test</title></head><body><div id='Content'><div class='confluence-jim-macro jira-table'>${cheerioBody}</div></div></body></html>`,
    );
    await step(context);
    const $ = context.getCheerioBody();
    const baseUrl = config.get('confluence.baseURL');
    const data = JSON.stringify([
      {
        key: {
          name: 'FND-319',
          link: `${baseUrl}/browse/FND-319?src=confmacro`,
        },
        t: { name: 'issue', icon: 'image.png' },
        summary: {
          name: 'Awesome Summary',
          link: `${baseUrl}/browse/FND-319?src=confmacro`,
        },
        updated: '',
        assignee: 'an assignee',
        pr: { name: 'low', icon: 'image.png' },
        status: { name: 'a status' },
        resolution: 'resolved',
      },
    ]);
    expect($('body').html()).toContain(`data: ${data}`);
  });

  it('should update the issue title and status of a jira-issue', async () => {
    const example =
      '<html><head></head><body>' +
      '<span class="confluence-jim-macro jira-issue" data-jira-key="FND-319" data-macro-name="jira">' +
      '<a href="https://sanofi.atlassian.net/browse/FND-319" class="jira-issue-key">FND-319</a>' +
      '<span class="summary">Getting issue details...</span>' +
      '<span class="aui-lozenge aui-lozenge-subtle aui-lozenge-default issue-placeholder">STATUS</span>' +
      '</span>' +
      '</body></html>';
    context.setHtmlBody(example);
    await step(context);
    const $ = context.getCheerioBody();
    const jiraIssueElem = $('span.confluence-jim-macro.jira-issue');
    expect($(jiraIssueElem).find('.summary').first().text()).toBe(mockedIssueData.fields.summary);
    expect($(jiraIssueElem).find('.aui-lozenge').first().text()).toBe(mockedIssueData.fields.status.name.toUpperCase());
  });

  it('should NOT update a jira-table', async () => {
    const example =
      '<html><head></head><body>' +
      '<div class="confluence-jim-macro refresh-module-id jira-table placeholder conf-macro output-block" data-macro-name="jira"></div>' +
      '</body></html>';
    context.setHtmlBody(example);
    const expected =
    '<html><head></head><body><div id="Content">' +
    '<div class="confluence-jim-macro refresh-module-id jira-table placeholder conf-macro output-block" data-macro-name="jira"></div>' +
    '</div></body></html>';
    await step(context);
    expect(context.getHtmlBody()).toBe(expected); // no change
  });
});
