import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface XrayTestRun {
  id: string;
  status?: { name?: string; color?: string; description?: string };
  test?: { issueId?: string; jira?: { key?: string; summary?: string } };
  testExecution?: {
    issueId?: string;
    jira?: { key?: string; fixVersions?: { name?: string }[] };
  };
  testEnvironments?: string[];
  startedOn?: string;
  finishedOn?: string;
  executedById?: string;
  assigneeId?: string;
  defects?: string[];
  comment?: string;
}

// Xray caps the `limit` argument of GraphQL connections at 100.
const XRAY_MAX_PAGE_SIZE = 100;

/**
 * @class XrayService
 * @description Client for the Xray Cloud API used to fetch test executions /
 * test runs that are not available through the standard Jira REST API.
 * Xray Cloud exposes a GraphQL API that must be authenticated with a bearer
 * token obtained from a Client ID / Client Secret pair (Xray API key).
 * @see https://docs.getxray.app/display/XRAYCLOUD/GraphQL+API
 */
@Injectable()
export class XrayService {
  private readonly logger = new Logger(XrayService.name);

  private token = '';

  // Xray Cloud tokens are valid for 24h; refresh a bit earlier to be safe.
  private tokenExpiresAt = 0;

  constructor(private http: HttpService, private config: ConfigService) {}

  /**
   * @function isConfigured
   * @description Whether the Xray credentials are available. When they are not,
   * the snapshot step degrades gracefully instead of failing the page render.
   */
  isConfigured(): boolean {
    return Boolean(this.config.get('xray.clientId') && this.config.get('xray.clientSecret'));
  }

  /**
   * @function authenticate
   * @description Obtains (and caches) a bearer token from the Xray Cloud API.
   * @return Promise {string} the bearer token
   */
  private async authenticate(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }
    const baseURL = this.config.get('xray.baseURL');
    const clientId = this.config.get('xray.clientId');
    const clientSecret = this.config.get('xray.clientSecret');

    const response = await firstValueFrom(
      this.http.post(
        `${baseURL}/authenticate`,
        { client_id: clientId, client_secret: clientSecret },
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );
    // The endpoint returns the token as a raw JSON string.
    this.token = typeof response.data === 'string' ? response.data.replace(/^"|"$/g, '') : response.data;
    // Cache for 23h to stay within the 24h validity window.
    this.tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
    this.logger.log('Retrieved Xray authentication token');
    return this.token;
  }

  /**
   * @function getTestRunsByTestIds
   * @description Returns the Test Runs of the given Test issues, identified by
   * their Jira (numeric) issue ids. In a Jira Snapshot the Xray level nests under
   * its parent Test (a "Test Case"), so we query by Test and group the runs back
   * per Test via `run.test.issueId`. Each run also carries its Test Execution
   * (key + fix versions), used to populate the snapshot columns. A single batched
   * query is used, transparently paginating beyond Xray's 100-item page limit.
   * @param testIds {string[]} the Jira issue ids of the parent Tests
   * @return Promise {XrayTestRun[]}
   */
  async getTestRunsByTestIds(testIds: string[]): Promise<XrayTestRun[]> {
    if (!this.isConfigured()) {
      this.logger.warn('Xray credentials are not configured - skipping test run retrieval');
      return [];
    }
    const ids = (testIds ?? []).filter(Boolean);
    if (ids.length === 0) {
      return [];
    }
    try {
      const token = await this.authenticate();
      const baseURL = this.config.get('xray.baseURL');
      const testRuns: XrayTestRun[] = [];
      let start = 0;
      let total = Infinity;

      /* eslint-disable no-await-in-loop */
      while (start < total) {
        const response = await firstValueFrom(
          this.http.post(
            `${baseURL}/graphql`,
            { query: this.buildTestRunsQuery(ids, start) },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            },
          ),
        );

        const page = response.data?.data?.getTestRuns ?? {};
        const results: XrayTestRun[] = page.results ?? [];
        testRuns.push(...results);
        total = typeof page.total === 'number' ? page.total : testRuns.length;
        if (results.length === 0) {
          break;
        }
        start += XRAY_MAX_PAGE_SIZE;
      }
      /* eslint-enable no-await-in-loop */

      this.logger.log(`Retrieved ${testRuns.length} Xray test runs for ${ids.length} test(s)`);
      return testRuns;
    } catch (error) {
      this.logger.error({
        msg: 'HTTP request error in getTestRunsByTestIds',
        testIds: ids,
        message: error.message,
        response: error.response
          ? { status: error.response.status, data: error.response.data }
          : undefined,
      });
      return [];
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private buildTestRunsQuery(testIds: string[], start: number): string {
    const idsArg = testIds.map((id) => `"${id}"`).join(', ');
    return `query {
      getTestRuns(testIssueIds: [${idsArg}], limit: ${XRAY_MAX_PAGE_SIZE}, start: ${start}) {
        total
        limit
        start
        results {
          id
          status { name color description }
          test { issueId jira(fields: ["key", "summary"]) }
          testExecution { issueId jira(fields: ["key", "fixVersions"]) }
          startedOn
          finishedOn
          executedById
          assigneeId
          defects
          comment
        }
      }
    }`;
  }
}
