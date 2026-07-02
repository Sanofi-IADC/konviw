/**
 * Renders the konviw report for the TRACK4 release-report "Test execution"
 * Jira Snapshot (WEB-2475), using the REAL macroParams and REAL Jira data for
 * the issue levels (Requirements -> Test Cases) fetched live from Jira, plus
 * representative Xray Test Runs for the XRAY_TESTRUNS level (Xray prod
 * credentials are still pending, so those rows are sample data).
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register scripts/track4ReportDemo.ts
 * It writes a self-contained HTML file (Grid.js from CDN) to tmp/track4-report.html.
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import 'dotenv/config';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import configuration from '../src/config/configuration';
import { XrayService } from '../src/xray/xray.service';
import {
  GRIDJS_CDN_CSS,
  GRIDJS_CDN_JS,
  commonJiraFields,
  renderSnapshotDemo,
  runDemo,
  xrayTestRunsLevel,
} from './xrayDemoShared';

const SITE = 'https://sanofi.atlassian.net';

const storyType = {
  self: '',
  id: '10001',
  description: 'Story',
  name: 'Story',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMyIgZmlsbD0iIzYzQkEzQyIvPjxyZWN0IHg9IjQiIHk9IjMiIHdpZHRoPSI4IiBoZWlnaHQ9IjEwIiByeD0iMSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
};
const businessProcess = [{ self: '', id: '15835', name: 'Business Process' }];

// --- REAL Requirements (level 0), fetched from Jira -------------------------
const requirements = [
  {
    id: '868373',
    key: 'TRACK4-676',
    self: `${SITE}/browse/TRACK4-676`,
    fields: {
      summary: 'Track4- Data Lake - Batch data extract',
      components: businessProcess,
      customfield_10014: 'TRACK4-100',
      issuetype: storyType,
    },
  },
  {
    id: '868365',
    key: 'TRACK4-673',
    self: `${SITE}/browse/TRACK4-673`,
    fields: {
      summary: 'Track4- Data Lake Event extract',
      components: businessProcess,
      customfield_10014: 'TRACK4-100',
      issuetype: storyType,
    },
  },
  {
    id: '868363',
    key: 'TRACK4-672',
    self: `${SITE}/browse/TRACK4-672`,
    fields: {
      summary: 'Track4- Data Lake Location Master extract',
      components: businessProcess,
      customfield_10014: 'TRACK4-100',
      issuetype: storyType,
    },
  },
];

// --- REAL Test Cases (level 1), fetched from Jira via linkedIssues -----------
const activeStatus = {
  self: '',
  description: '',
  iconUrl: '',
  name: 'Active',
  id: '10095',
  statusCategory: {
    self: '', id: 3, key: 'done', colorName: 'green', name: 'Done',
  },
};
const testCaseByRequirement: Record<string, any[]> = {
  'TRACK4-676': [{
    id: '902604', key: 'TRACK4-737', self: `${SITE}/browse/TRACK4-737`, fields: { summary: 'Test TRACK4- Data lake Event and Batch data extract', status: activeStatus },
  }],
  'TRACK4-673': [{
    id: '902604', key: 'TRACK4-737', self: `${SITE}/browse/TRACK4-737`, fields: { summary: 'Test TRACK4- Data lake Event and Batch data extract', status: activeStatus },
  }],
  'TRACK4-672': [{
    id: '902597', key: 'TRACK4-736', self: `${SITE}/browse/TRACK4-736`, fields: { summary: 'Test TRACK4- Data lake Location Master extract', status: activeStatus },
  }],
};

// --- SAMPLE Xray Test Runs (level 2) - prod credentials still pending --------
const FIX = [{ name: 'Track4 2.0.1' }];
const testRunsByTestId: Record<string, any[]> = {
  902604: [
    {
      id: 'run-1', status: { name: 'PASSED', color: '#36B37E', description: 'Passed' }, test: { issueId: '902604', jira: { key: 'TRACK4-737' } }, testExecution: { issueId: '910001', jira: { key: 'TRACK4-900', fixVersions: FIX } }, defects: [],
    },
    {
      id: 'run-2', status: { name: 'FAILED', color: '#FF5630', description: 'Failed' }, test: { issueId: '902604', jira: { key: 'TRACK4-737' } }, testExecution: { issueId: '910002', jira: { key: 'TRACK4-901', fixVersions: FIX } }, defects: ['TRACK4-1413'],
    },
  ],
  902597: [
    {
      id: 'run-3', status: { name: 'PASSED', color: '#36B37E', description: 'Passed' }, test: { issueId: '902597', jira: { key: 'TRACK4-736' } }, testExecution: { issueId: '910001', jira: { key: 'TRACK4-900', fixVersions: FIX } }, defects: [],
    },
  ],
};

// --- Real macroParams shape extracted from the TRACK4 release-report page -----
const macroParams = {
  levels: [
    {
      jql: 'project="TRACK4" AND fixVersion = "Track4 2.0.1" AND issueLinkType = "is tested by"',
      title: 'Requirements (Stories/Enablers/Bugs)',
      levelType: 'JIRA_ISSUES',
      fieldsPosition: [
        { value: { id: 'summary' }, label: 'Summary' },
        { value: { id: 'components' }, label: 'Components' },
        { value: { id: 'customfield_10014' }, label: 'Epic Link' },
        { value: { id: 'issuetype' }, label: 'Issue Type' },
        { value: { id: 'key' }, label: 'Key' },
      ],
    },
    {
      jql: 'issue in linkedIssues("$key",\'is tested by\') AND issuetype = "Test" and status !="Cancelled"',
      title: 'Test Cases',
      levelType: 'JIRA_ISSUES',
      fieldsPosition: [
        { value: { id: 'key' }, label: 'Key' },
        { value: { id: 'summary' }, label: 'Summary' },
      ],
    },
    xrayTestRunsLevel,
  ],
};

// --- Mocked services (data is real where available) -------------------------
const jiraServiceMock = {
  async findTickets(_source: string, jql: string) {
    const linked = jql.match(/linkedIssues\("([^"]+)"/);
    if (linked) {
      const issues = testCaseByRequirement[linked[1]] ?? [];
      return { data: { total: issues.length, issues } };
    }
    return { data: { total: requirements.length, issues: requirements } };
  },
  async getFields() {
    return commonJiraFields();
  },
};

const xrayServiceMock = {
  async getTestRunsByTestIds(ids: string[]) {
    return ids.flatMap((id) => testRunsByTestId[id] ?? []);
  },
};

// --- Render -----------------------------------------------------------------
runDemo(async () => {
  const config = new ConfigService(configuration() as unknown as Record<string, unknown>);

  // Use the real Xray Cloud API when credentials are configured; otherwise fall
  // back to the sample data so the report still renders.
  const liveXray = new XrayService(new HttpService(), config);
  const xrayLive = liveXray.isConfigured();
  const xrayService = xrayLive ? liveXray : xrayServiceMock;
  const xrayNote = xrayLive
    ? 'Xray Test Run rows are <b>live Xray Cloud data</b>.'
    : 'Xray Test Run rows are <b>sample data</b> (production Xray credentials pending).';

  const htmlBody = '<html><head><meta charset="utf-8" /><title>TRACK4 Release Report - konviw</title>'
    + `<link href="${GRIDJS_CDN_CSS}" rel="stylesheet" />`
    + `<script src="${GRIDJS_CDN_JS}"></script>`
    + '<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:32px;color:#172B4D;}'
    + 'h1{font-size:20px;}h2{font-size:15px;color:#42526E;margin-top:24px;}'
    + '.note{background:#FFF7E6;border:1px solid #FFD591;padding:8px 12px;border-radius:4px;font-size:12px;margin-bottom:16px;}'
    + '</style></head><body><div id="Content">'
    + '<h1>Release Report - Serialization Track4 - Track4 2.0.1</h1>'
    + '<h2>Test execution snapshot (Requirements &rarr; Test Cases &rarr; Xray Test Runs)</h2>'
    + `<div class="note">Requirements and Test Cases are <b>live Jira data</b>. ${xrayNote}</div>`
    + '<div data-macro-name="jira-jql-snapshot"></div>'
    + '</div></body></html>';

  await renderSnapshotDemo({
    config,
    jiraService: jiraServiceMock,
    xrayService,
    macroParams,
    htmlBody,
    spaceKey: 'KONVIW',
    slug: 'track4',
    outputFileName: 'track4-report.html',
    logLabel: 'Report rendered',
  });
});
