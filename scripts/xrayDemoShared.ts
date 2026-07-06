/**
 * Shared helpers for the WEB-2475 Xray snapshot demo scripts
 * (xraySnapshotDemo.ts and track4ReportDemo.ts).
 *
 * Keeps the Grid.js CDN URLs, the XRAY_TESTRUNS macro level, the Jira field
 * metadata, the snapshot macro storage and the render/run boilerplate in one
 * place so the individual demos only declare their own sample data.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ContextService } from '../src/context/context.service';
import addJiraSnapshot from '../src/proxy-page/steps/addJiraSnapshot';

export const GRIDJS_CDN_CSS = 'https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css';
export const GRIDJS_CDN_JS = 'https://cdn.jsdelivr.net/npm/gridjs/dist/gridjs.umd.js';

/** The XRAY_TESTRUNS level as configured on the real TRACK4 release-report page. */
export const xrayTestRunsLevel = {
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
};

interface JiraField {
  id: string;
  key: string;
  name: string;
  schema: Record<string, unknown>;
}

/** Field metadata used by the snapshot renderer (superset covering both demos). */
export function commonJiraFields(): JiraField[] {
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
    {
      id: 'components', key: 'components', name: 'Components', schema: { type: 'array', items: 'component' },
    },
    {
      id: 'issuetype', key: 'issuetype', name: 'Issue Type', schema: { type: 'issuetype' },
    },
    {
      id: 'customfield_10014', key: 'customfield_10014', name: 'Epic Link', schema: { type: 'string' },
    },
  ];
}

/** Builds the Confluence storage body wrapping the jira-jql-snapshot macro. */
export function snapshotMacroStorage(macroParams: unknown): string {
  return '<ac:structured-macro ac:name="jira-jql-snapshot">'
    + `<ac:parameter ac:name="macroParams">${JSON.stringify(macroParams)}</ac:parameter>`
    + '</ac:structured-macro>';
}

export interface RenderSnapshotDemoOptions {
  config: ConfigService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jiraService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xrayService: any;
  macroParams: unknown;
  htmlBody: string;
  spaceKey: string;
  slug: string;
  outputFileName: string;
  logLabel?: string;
}

/**
 * Runs the real addJiraSnapshot step against a prepared context and writes the
 * resulting HTML to tmp/<outputFileName>. Returns the output file path.
 */
export async function renderSnapshotDemo({
  config,
  jiraService,
  xrayService,
  macroParams,
  htmlBody,
  spaceKey,
  slug,
  outputFileName,
  logLabel = 'Rendered',
}: RenderSnapshotDemoOptions): Promise<string> {
  const context = new ContextService(config);
  context.initPageContext('v2', spaceKey, slug, 'light');
  context.setHtmlBody(htmlBody);
  context.setBodyStorage(snapshotMacroStorage(macroParams));

  await addJiraSnapshot(config, jiraService, xrayService)(context);

  const outputDir = join(__dirname, '..', 'tmp');
  mkdirSync(outputDir, { recursive: true });
  const outputFile = join(outputDir, outputFileName);
  writeFileSync(outputFile, context.getHtmlBody(), 'utf-8');

  // eslint-disable-next-line no-console
  console.log(`\n${logLabel}:\n  ${outputFile}\n`);
  return outputFile;
}

/** Executes a demo main() with consistent error handling / exit code. */
export function runDemo(main: () => Promise<unknown>): void {
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
}
