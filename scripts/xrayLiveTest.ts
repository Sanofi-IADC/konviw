/**
 * Live smoke test for the Xray Cloud integration (WEB-2475).
 *
 * Loads the real CPV_XRAY_* credentials from .env, authenticates against the
 * Xray Cloud API and fetches Test Runs for a couple of real TRACK4 Tests to
 * confirm end-to-end connectivity. Prints only non-sensitive output.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register scripts/xrayLiveTest.ts [testIssueId ...]
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import 'dotenv/config';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import configuration from '../src/config/configuration';
import { XrayService } from '../src/xray/xray.service';

// Real TRACK4 Test issue ids (TRACK4-737, TRACK4-736) unless overridden by args.
const DEFAULT_TEST_IDS = ['902604', '902597'];

async function run() {
  const testIds = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_TEST_IDS;

  const config = new ConfigService(configuration() as unknown as Record<string, unknown>);
  const http = new HttpService();
  const xray = new XrayService(http, config);

  // eslint-disable-next-line no-console
  console.log('Xray configured:', xray.isConfigured());
  // eslint-disable-next-line no-console
  console.log('Base URL:', config.get('xray.baseURL'));
  // eslint-disable-next-line no-console
  console.log('Querying test runs for test ids:', testIds.join(', '), '\n');

  const runs = await xray.getTestRunsByTestIds(testIds);

  // eslint-disable-next-line no-console
  console.log(`\nTotal test runs returned: ${runs.length}\n`);
  runs.slice(0, 20).forEach((r) => {
    const line = [
      `test=${r.test?.jira?.key ?? r.test?.issueId ?? '?'}`,
      `exec=${r.testExecution?.jira?.key ?? '?'}`,
      `status=${r.status?.name ?? '?'}`,
      `fixVersions=${(r.testExecution?.jira?.fixVersions ?? []).map((v) => v?.name).join('|') || '-'}`,
      `envs=${(r.testEnvironments ?? []).join('|') || '-'}`,
      `defects=${(r.defects ?? []).join('|') || '-'}`,
    ].join('  ');
    // eslint-disable-next-line no-console
    console.log(`  ${line}`);
  });
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Live test failed:', error?.message ?? error);
  process.exit(1);
});
