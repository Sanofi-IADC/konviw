/**
 * Standalone, credentials-free visual demo for the Xray Test Run rendering in
 * Jira Snapshots (WEB-2475).
 *
 * It runs the real `addJiraSnapshot` step against a sample snapshot page, with
 * the Jira and Xray APIs mocked, and writes a self-contained HTML file you can
 * open in a browser to visually verify the rendered grid.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register scripts/xraySnapshotDemo.ts
 * then open the printed file path in a browser.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import configuration from '../src/config/configuration.test';
import { ContextService } from '../src/context/context.service';
import addJiraSnapshot from '../src/proxy-page/steps/addJiraSnapshot';

// --- Sample data -----------------------------------------------------------
//
// Mirrors the real macro structure observed on the TRACK4 release-report page:
//   Test Cases (issuetype = Test)  ->  Test execution (XRAY_TESTRUNS)
// with the actual configured columns: testexeckey, status, fixversions, defects.

// Parent Test Cases returned by the Jira API (level 0).
const testCases = [
  {
    id: '20001', key: 'TRACK4-T1', self: '', fields: { summary: 'Login works' },
  },
  {
    id: '20002', key: 'TRACK4-T2', self: '', fields: { summary: 'Serial number scan' },
  },
  {
    id: '20003', key: 'TRACK4-T3', self: '', fields: { summary: 'Aggregation report' },
  },
];

// Xray Test Runs grouped (via test.issueId) under the Test Cases above. Each run
// carries its Test Execution (key + fix versions), as returned by getTestRuns.
const testRuns = [
  {
    id: 'run-1',
    status: { name: 'PASSED', color: '#67AB49', description: 'Passed' },
    test: { issueId: '20001', jira: { key: 'TRACK4-T1', summary: 'Login works' } },
    testExecution: { issueId: '10001', jira: { key: 'TRACK4-EXEC-1', fixVersions: [{ name: 'Track4 2.0.1' }] } },
    defects: [],
  },
  {
    id: 'run-2',
    status: { name: 'FAILED', color: '#D04437', description: 'Failed' },
    test: { issueId: '20002', jira: { key: 'TRACK4-T2', summary: 'Serial number scan' } },
    testExecution: { issueId: '10001', jira: { key: 'TRACK4-EXEC-1', fixVersions: [{ name: 'Track4 2.0.1' }] } },
    defects: ['TRACK4-BUG-9'],
  },
  {
    id: 'run-3',
    status: { name: 'TODO', color: '#6B778C', description: 'Not run' },
    test: { issueId: '20003', jira: { key: 'TRACK4-T3', summary: 'Aggregation report' } },
    testExecution: { issueId: '10002', jira: { key: 'TRACK4-EXEC-2', fixVersions: [{ name: 'Track4 2.0.1' }] } },
    defects: [],
  },
];

// Real macroParams shape extracted from the TRACK4 release-report page.
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
      ],
    },
  ],
};

// --- Mocked services -------------------------------------------------------

const jiraServiceMock = {
  async findTickets() {
    return { data: { total: testCases.length, issues: testCases } };
  },
  async getFields() {
    return [
      {
        id: 'key', key: 'key', name: 'Key', schema: { type: 'issuelinks' },
      },
      {
        id: 'summary', key: 'summary', name: 'Summary', schema: { type: 'string' },
      },
      {
        id: 'status', key: 'status', name: 'Status', schema: { type: 'status' },
      },
    ];
  },
};

const xrayServiceMock = {
  async getTestRunsByTestIds(ids: string[]) {
    return testRuns.filter((testRun) => ids.includes(testRun.test.issueId));
  },
};

// --- Render ----------------------------------------------------------------

const GRIDJS_CDN_CSS = 'https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css';
const GRIDJS_CDN_JS = 'https://cdn.jsdelivr.net/npm/gridjs/dist/gridjs.umd.js';

async function run() {
  const config = new ConfigService(configuration() as unknown as Record<string, unknown>);
  const context = new ContextService(config);
  context.initPageContext('v2', 'KONVIW', 'demo', 'light');

  context.setHtmlBody(
    '<html><head><title>Xray Snapshot Demo</title>'
    + `<link href="${GRIDJS_CDN_CSS}" rel="stylesheet" />`
    + '</head><body><div id="Content">'
    + '<h2>Jira Snapshot with Xray Test Runs (mocked data)</h2>'
    + '<div data-macro-name="jira-jql-snapshot"></div>'
    + `<script src="${GRIDJS_CDN_JS}"></script>`
    + '</div></body></html>',
  );
  context.setBodyStorage(
    '<ac:structured-macro ac:name="jira-jql-snapshot">'
    + `<ac:parameter ac:name="macroParams">${JSON.stringify(macroParams)}</ac:parameter>`
    + '</ac:structured-macro>',
  );

  await addJiraSnapshot(config, jiraServiceMock as any, xrayServiceMock as any)(context);

  const outputDir = join(__dirname, '..', 'tmp');
  mkdirSync(outputDir, { recursive: true });
  const outputFile = join(outputDir, 'xray-snapshot-demo.html');
  writeFileSync(outputFile, context.getHtmlBody(), 'utf-8');

  // eslint-disable-next-line no-console
  console.log(`\nDemo rendered. Open this file in a browser:\n  ${outputFile}\n`);
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
