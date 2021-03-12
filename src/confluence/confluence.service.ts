import { Logger, HttpException, HttpService, Injectable } from '@nestjs/common';

@Injectable()
export class ConfluenceService {
  private readonly logger = new Logger(ConfluenceService.name);
  constructor(private http: HttpService) {}

  /**
   * @function getPage Service
   * @description Return a page from a Confluence space
   * @return Promise {any}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   */
  async getPage(spaceKey: string, pageId: string): Promise<any> {
    try {
      const results = await this.http
        .get(`/rest/api/content/${pageId}`, {
          params: {
            type: 'page',
            spaceKey,
            expand: [
              // fields to retrieve
              'body.styled_view',
              'metadata.properties.content_appearance_published',
              'metadata.labels',
              'version,history',
            ].join(','),
          },
        })
        .toPromise();
      this.logger.log(`Retrieving page ${pageId}`);
      return results.data;
    } catch (err) {
      this.logger.log(err, 'error:getPage');
      throw new HttpException(`error:getPage for page ${pageId} > ${err}`, 404);
    }
  }

  /**
   * @function getRedirectUrlForMedia Service
   * @description Route to retrieve the standard media files like images and videos (usually attachments)
   * @return Promise {string} 'url' - URL of the media to display
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   */
  async getRedirectUrlForMedia(uri: string): Promise<string> {
    try {
      const results = await this.http
        .get(uri, {
          maxRedirects: 0,
          validateStatus: (status) => {
            return status === 302;
          },
        })
        .toPromise();
      // this.logger.log(`Retrieving media from ${uri}`);
      return results.headers.location;
    } catch (err) {
      this.logger.log(err, 'error:getRedirectUrlForMedia');
      throw new HttpException(`error:getRedirectUrlForMedia > ${err}`, 404);
    }
  }

  /**
   * TODO: Make this function generic enough to serve standard search or
   * TODO: get blog posts. Include options like 'type', 'date-range', 'ancestor' ...
   * @function getResults Service
   * @description Search results from Confluence API /rest/api/search
   * @return Promise {any}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param query {string} - space key identifying the document space from Confluence
   * @param scope {string} - space key identifying the document space from Confluence
   */
  async getResults(spaceKey: string, query: string): Promise<any> {
    const spaces: string[] = spaceKey.split('|');
    let cql = `(type=blogpost OR type=page)`;
    cql = `${cql} AND (label!="draft") AND (label="public")`;
    const cqlSpacesStr = spaces
      .map((space: any): string => {
        return `(space=${space})`;
      })
      .join(' OR ');
    cql = `${cql} AND (${cqlSpacesStr})`;
    cql = query ? `${cql} AND (text ~ "${query}")` : cql;
    try {
      const results = await this.http
        .get('/rest/api/search', {
          params: {
            limit: 999, // number of item per page
            cql,
            excerpt: 'highlight', // use "highlight" to enclosed word found in @@@hl@@@ and @@@endhl@@@
            expand: [
              // fields to retrieve
              'content.history',
              'content.metadata.labels',
              'content.body.styled_view',
            ].join(','),
          },
        })
        .toPromise();
      this.logger.log(`Searching ${cql} via REST API`);
      return results.data;
    } catch (err) {
      this.logger.log(err, 'error:getResults');
      throw new HttpException(`error:getResults > ${err}`, 404);
    }
  }

  /**
   * @function getAllPosts Service
   * @description Return all blog posts published in a Confluence space
   * @return Promise {any}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   */
  async getAllPosts(spaceKey: string): Promise<any> {
    let cpl = `(type=blogpost)`;
    cpl = `${cpl} AND (label !="draft") AND (label ="published")`;
    cpl = `${cpl} AND (space=${spaceKey})`;
    try {
      const results = await this.http
        .get('/rest/api/search', {
          params: {
            limit: 999,
            cql: cpl,
            // excerpt: "highlight", // use "highlight" to enclosed word found in @@@hl@@@ and @@@endhl@@@
            expand: [
              // fields to retrieve
              'content.history',
              'content.metadata.labels',
              'content.body.styled_view',
              // 'content.body.view',
            ].join(','),
          },
        })
        .toPromise();
      this.logger.log('Retrieving all blog posts published via REST API');
      return results.data;
    } catch (err) {
      this.logger.log(err, 'error:getAllPosts');
      throw new HttpException(`error:getAllPosts > ${err}`, 404);
    }
  }
}
