import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface XrayJiraStatus {
  name?: string;
  description?: string;
  iconUrl?: string;
  id?: string;
  statusCategory?: { colorName?: string; name?: string };
}

export interface XrayEvidence {
  id?: string;
  filename?: string;
  downloadLink?: string;
}

export interface XrayTestRun {
  id: string;
  status?: { name?: string; color?: string; description?: string };
  test?: { issueId?: string; jira?: { key?: string; summary?: string } };
  testExecution?: {
    issueId?: string;
    // `jira` is resolved server-side from the Test Execution Jira issue, so it
    // carries whatever fields we request (key, summary, fixVersions, status).
    jira?: {
      key?: string;
      summary?: string;
      fixVersions?: { name?: string }[];
      status?: XrayJiraStatus;
    };
    // Test environments are a property of the Test Execution in Xray (the
    // TestRun type does not expose them), so they are nested here.
    testEnvironments?: string[];
  };
  // The Test version this run was executed against (e.g. name "v1", id 1).
  testVersion?: { id?: number; name?: string };
  startedOn?: string;
  finishedOn?: string;
  // Account ids of the executor / assignee; resolved to display names later.
  executedById?: string;
  assigneeId?: string;
  defects?: string[];
  comment?: string;
  gherkin?: string;
  unstructured?: string;
  evidence?: XrayEvidence[];
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

  /**
   * @function getAttachment
   * @description Downloads a Test Run evidence/attachment by its id, using the
   * authenticated Xray REST endpoint (`/attachments/:id`). The `downloadLink`
   * returned by the GraphQL API points at an `/enterprise/...` path that is not
   * directly reachable and, like every Xray endpoint, requires a bearer token a
   * browser cannot supply - so konviw proxies the download server-side instead.
   * @param id {string} the Xray attachment id (equals the evidence id)
   * @return Promise {{ data: Buffer; contentType: string }}
   */
  async getAttachment(id: string): Promise<{ data: Buffer; contentType: string }> {
    if (!this.isConfigured()) {
      throw new Error('Xray credentials are not configured');
    }
    const token = await this.authenticate();
    const baseURL = this.config.get('xray.baseURL');
    const response = await firstValueFrom(
      this.http.get(`${baseURL}/attachments/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
      }),
    );
    const data = Buffer.from(response.data);
    const headerContentType = response.headers?.['content-type'];
    // Xray serves evidence as `application/octet-stream`, which prevents the
    // browser from rendering it inline. Sniff the magic bytes so images get a
    // proper `image/*` type and can be shown as thumbnails in the grid.
    const contentType = (!headerContentType || headerContentType === 'application/octet-stream')
      ? (XrayService.sniffContentType(data) ?? headerContentType ?? 'application/octet-stream')
      : headerContentType;
    return { data, contentType };
  }

  // Detects a content type from the leading "magic" bytes of a buffer. Returns
  // undefined when the type is not recognised so the caller can keep the
  // original header value.
  private static sniffContentType(buffer: Buffer): string | undefined {
    if (!buffer || buffer.length < 4) {
      return undefined;
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'image/png';
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return 'image/gif';
    }
    if (
      buffer.length >= 12
      && buffer.toString('ascii', 0, 4) === 'RIFF'
      && buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'image/webp';
    }
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return 'image/bmp';
    }
    // SVG is text-based; check the initial bytes for an <svg> tag (optionally after an XML header).
    const head = buffer.toString('utf8', 0, Math.min(buffer.length, 256)).trimStart().toLowerCase();
    if (head.includes('<svg')) {
      return 'image/svg+xml';
    }
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'application/pdf';
    }
    return undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  private buildTestRunsQuery(testIds: string[], start: number): string {
    // Encode each id as a JSON string so an unexpected character (e.g. a quote)
    // cannot break out of the GraphQL string literal / alter the query.
    const idsArg = testIds.map((id) => JSON.stringify(String(id))).join(', ');
    return `query {
      getTestRuns(testIssueIds: [${idsArg}], limit: ${XRAY_MAX_PAGE_SIZE}, start: ${start}) {
        total
        limit
        start
        results {
          id
          status { name color description }
          test { issueId jira(fields: ["key", "summary"]) }
          testExecution { issueId jira(fields: ["key", "summary", "status", "fixVersions"]) testEnvironments }
          testVersion { id name }
          startedOn
          finishedOn
          executedById
          assigneeId
          defects
          comment
          gherkin
          unstructured
          evidence { id filename downloadLink }
        }
      }
    }`;
  }
}
