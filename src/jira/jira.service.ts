import { HttpService, Injectable } from '@nestjs/common';

@Injectable()
export class JiraService {
  constructor(private http: HttpService) {}

  /**
   * @function findTickets Service
   * @description Return a the tickets selected in the Jira macro
   * @return Promise {any}
   * @param jqlSearch {string} 'project = FND ORDER BY resolution DESC' - Jira Query Language to filter the issues to retrieve
   * @param maxResult {number} 100 - maximum number of issues retrieved
   */
  findTickets(
    jqlSearch: string,
    fields: string,
    maxResult = 100,
  ): Promise<any> {
    return this.http
      .get(
        `/rest/api/2/search?jql=${jqlSearch}&fields=${fields}&maxResults=${maxResult}`,
      )
      .toPromise()
      .then((res) => res.data);
  }
}
