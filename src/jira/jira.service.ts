import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios'; // eslint-disable-line import/no-extraneous-dependencies
import { firstValueFrom } from 'rxjs';

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
   * @function getTicket
   * @description Returns the ticket data based on the ID or key
   * @param key {string} the ID or key of the desired Jira issue
   * @return Promise {any}
   */
  getTicket(key: string): Promise<any> {
    return firstValueFrom(
      this.http.get(`${this.baseUrl}/rest/api/2/issue/${key}`, {
        auth: { username: this.apiUsername, password: this.apiToken },
      }),
    )
      .then((res) => res.data)
      .catch((e) => {
        this.logger.log(e, 'error:getTicket');
      });
  }

  /**
   * @function getMacro
   * @description return the macro data based on the pageID and macroID
   * @param pageId
   * @param macroId
   * @returns Promise {any}
   */
  getMaCro(pageId: string, macroId: string): Promise<any> {
    return firstValueFrom(
      this.http.get(
        `${this.baseUrl}/wiki/rest/api/content/${pageId}/history/0/macro/id/${macroId}`,
        {
          auth: { username: this.apiUsername, password: this.apiToken },
        },
      ),
    )
      .then((res) => res.data)
      .catch((e) => {
        this.logger.log(e, 'error:getMaCro');
      });
  }

  /**
   * @function findTickets Service
   * @description Return a the tickets selected in the Jira macro
   * @return Promise {any}
   * @param jqlSearch {string} 'project = FND ORDER BY resolution DESC' - Jira Query Language to filter the issues to retrieve
   * @param fields {string} 'fields=field1,field2&fields=field3' - A list of fields to return for each issue
   * @param maxResult {number} 100 - maximum number of issues retrieved
   * @param startAt {number} 15 - starting position to handle paginated results
   */
  async findTickets(
    server: string,
    jqlSearch: string,
    fields: string,
    startAt = 0,
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
    return firstValueFrom(
      this.http.get(
        `${this.baseUrl}/rest/api/3/search?jql=${jqlSearch}&fields=${fields}&maxResults=${maxResult}&startAt=${startAt}`,
        { auth: { username: this.apiUsername, password: this.apiToken } },
      ),
    )
      .then((response) => response.data)
      .catch((e) => {
        this.logger.log(e, 'error:findTickets');
      });
  }

  /**
   * @function findProjects Service
   * @description Return a the projects matching the filter criteria
   * @return Promise {any}
   * @param server {string} 'Syatem Jira' - Jira server to search in
   * @param search {string} 'iadc - word to be searched
   * @param startAt {number} 15 - starting position to handle paginated results
   */
  async findProjects(
    server: string,
    search: string,
    startAt: number,
    maxResults: number,
    categoryId,
  ): Promise<AxiosResponse> {
    // Load new base URL and credencials if defined a specific connection for Jira as ENV variables
    const key = `CPV_JIRA_${server.replace(/\s/, '_')}`;
    const baseUrl = process.env[`${key}_BASE_URL`];
    if (baseUrl) {
      this.baseUrl = baseUrl;
      this.apiUsername = process.env[`${key}_API_USERNAME`];
      this.apiToken = process.env[`${key}_API_TOKEN`];
    }
    let params: any = {
      startAt,
      maxResults,
      orderBy: 'name',
      searchBy: 'key, name',
      expand: 'description,lead,insight',
      query: search,
    };
    if (categoryId !== 0) {
      params = {
        ...params,
        categoryId,
      };
    }
    try {
      const results: AxiosResponse = await firstValueFrom(
        this.http.get(`${this.baseUrl}/rest/api/3/project/search`, {
          auth: { username: this.apiUsername, password: this.apiToken },
          params,
        }),
      );
      this.logger.log(`Retrieving projects from ${server}`);
      return results;
    } catch (err) {
      this.logger.log(err, 'error:findProjects');
      throw new HttpException(
        `error:API findProjects for server ${server} > ${err}`,
        404,
      );
    }
  }

  /**
   * @function findProjectCategories Service
   * @description Return a the categories created to classify Jira projects
   * @return Promise {any}
   */
  async findProjectCategories(server: string): Promise<AxiosResponse> {
    // Load new base URL and credencials if defined a specific connection for Jira as ENV variables
    const key = `CPV_JIRA_${server.replace(/\s/, '_')}`;
    const baseUrl = process.env[`${key}_BASE_URL`];
    if (baseUrl) {
      this.baseUrl = baseUrl;
      this.apiUsername = process.env[`${key}_API_USERNAME`];
      this.apiToken = process.env[`${key}_API_TOKEN`];
    }
    try {
      const results: AxiosResponse = await firstValueFrom(
        this.http.get(`${this.baseUrl}/rest/api/3/projectCategory`, {
          auth: { username: this.apiUsername, password: this.apiToken },
        }),
      );
      this.logger.log(`Retrieving project categories from ${server}`);
      return results;
    } catch (err) {
      this.logger.log(err, 'error:findProjectCategories');
      throw new HttpException(
        `error:API findProjectCategories for server ${server} > ${err}`,
        404,
      );
    }
  }

  /**
   * @function findProjectIssueTypesWithStatus Service
   * @description Returns the valid statuses for a project. The statuses are grouped by issue type,
   *              as each project has a set of valid issue types and each issue type has a set of valid statuses.
   * @return Promise {any}
   */
  async findProjectIssueTypesWithStatus(server: string, projectKey: string): Promise<AxiosResponse> {
    // Load new base URL and credencials if defined a specific connection for Jira as ENV variables
    const key = `CPV_JIRA_${server.replace(/\s/, '_')}`;
    const baseUrl = process.env[`${key}_BASE_URL`];
    if (baseUrl) {
      this.baseUrl = baseUrl;
      this.apiUsername = process.env[`${key}_API_USERNAME`];
      this.apiToken = process.env[`${key}_API_TOKEN`];
    }
    return firstValueFrom(
      this.http.get(
        `${this.baseUrl}/rest/api/3/project/${projectKey}/statuses`,
        { auth: { username: this.apiUsername, password: this.apiToken } },
      ),
    )
      .then((response) => {
        this.logger.log(`Retrieving project statuses from ${server} for project - ${projectKey}`);
        return response;
      })
      .catch((err) => {
        this.logger.log(err, 'error:findProjectIssuesTypeWithStatus');
        throw new HttpException(
          `error:API findProjectIssuesTypeWithStatus for server ${server} > ${err}`,
          404,
        );
      });
  }
}
