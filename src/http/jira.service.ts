import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JiraService {
  baseUrl = 'https://iadc.atlassian.net/rest/api/2';

  headers = {};

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    const credentials = `${this.configService.get(
      'confluence.apiUsername',
    )}:${this.configService.get('confluence.apiToken')}`;

    this.headers = {
      Authorization: `Basic ${credentials}`,
    };
  }

  findTickets(jqlSearch: string, fields: string, maxResult = 100) {
    const url = `${this.baseUrl}/search?jql=${jqlSearch}&fields=${fields}&maxResults=${maxResult}`;

    return this.httpService
      .get(url, {
        headers: this.headers,
      })
      .toPromise()
      .then((res) => res.data);
  }
}
