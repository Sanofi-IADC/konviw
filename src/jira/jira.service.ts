import { HttpService, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JiraService {
  private readonly logger = new Logger(JiraService.name);
  private baseUrl = '';
  private apiUsername = '';
  private apiToken = '';

  // Default API connection for Jira is the same as for Confluence
  constructor(private http: HttpService, private config: ConfigService) {
    this.baseUrl = this.config.get('confluence.baseURL');
    this.apiUsername = this.config.get('confluence.apiUsername');
    this.apiToken = this.config.get('confluence.apiToken');
  }

  /**
   * @function findTickets Service
   * @description Return a the tickets selected in the Jira macro
   * @return Promise {any}
   * @param jqlSearch {string} 'project = FND ORDER BY resolution DESC' - Jira Query Language to filter the issues to retrieve
   * @param maxResult {number} 100 - maximum number of issues retrieved
   */
  findTickets(
    server: string,
    jqlSearch: string,
    fields: string,
    maxResult = 100,
  ): Promise<any> {
    // Load new base URL and credencials if defined a specific connection for Jira as ENV variables
    const key = `CPV_JIRA_${server.replace(/\s/, '_')}`;
    const baseUrl = process.env[`${key}_BASE_URL`];
    if (baseUrl) {
      this.baseUrl = baseUrl;
      this.apiUsername = process.env[`${key}_API_USERNAME`];
      this.apiToken = process.env[`${key}_API_TOKEN`];
    }
    return this.http
      .get(
        `${this.baseUrl}/rest/api/2/search?jql=${jqlSearch}&fields=${fields}&maxResults=${maxResult}`,
        { auth: { username: this.apiUsername, password: this.apiToken } },
      )
      .toPromise()
      .then((res) => res.data)
      .catch((e) => {
        this.logger.log(e, 'error:findTickets');
      });
  }
}
