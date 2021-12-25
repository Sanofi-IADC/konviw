import {
  Logger,
  HttpException,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';

@Injectable()
export class ConfluenceService {
  private readonly logger = new Logger(ConfluenceService.name);
  constructor(
    private http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * @function getPage Service
   * @description Return a page from a Confluence space
   * @return Promise {any}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   */
  async getPage(spaceKey: string, pageId: string): Promise<AxiosResponse> {
    let results: AxiosResponse;
    try {
      results = await this.http
        .get(`/wiki/rest/api/content/${pageId}`, {
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
    } catch (err) {
      this.logger.log(err, 'error:getPage');
      throw new HttpException(`${err}\nPage ${pageId} Not Found`, 404);
    }
    // Check if the label defined in configuration for private pages is present in the metadata labels
    if (
      results.data.metadata.labels.results.find(
        (label: { name: string }) =>
          label.name === this.config.get('konviw.private'),
      )
    ) {
      this.logger.log(`Page ${pageId} can't be rendered because is private`);
      throw new ForbiddenException('This page is private.');
    }
    return results;
  }

  /**
   * @function getRedirectUrlForMedia Service
   * @description Route to retrieve the standard media files like images and videos (usually attachments)
   * @return Promise {string} 'url' - URL of the media to display
   * @param uri {string}
   */
  async getRedirectUrlForMedia(uri: string): Promise<string> {
    try {
      const results = await this.http
        .get(`/wiki/${uri}`, {
          maxRedirects: 0,
          validateStatus: (status) => {
            return status === 302;
          },
        })
        .toPromise();
      this.logger.log(`Retrieving media from ${uri}`);
      return results.headers.location;
    } catch (err) {
      this.logger.log(err, 'error:getRedirectUrlForMedia');
      throw new HttpException(`error:getRedirectUrlForMedia > ${err}`, 404);
    }
  }

  /**
   * TODO: Make this function generic enough to serve standard search or
   * get blog posts. Include options like 'type', 'date-range', 'ancestor' ...
   * @function getResults Service
   * @description Search results from Confluence API /rest/api/search
   * @return Promise {any}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param query {string} - space key identifying the document space from Confluence
   */
  async getResults(
    spaceKey: string,
    query: string,
    maxResult = 999,
    cursorResults = '',
  ): Promise<AxiosResponse> {
    let uriSearch: string;
    let params: any = {};
    let cql: string;
    if (cursorResults !== '') {
      uriSearch = `/wiki${cursorResults}`;
    } else {
      uriSearch = '/wiki/rest/api/search';
      const spaces: string[] = spaceKey.split('|');
      cql = `(type=blogpost OR type=page)`;
      cql = `${cql} AND (label!=draft) AND (label=public)`;
      const cqlSpacesStr = spaces
        .map((space: any): string => {
          return `(space=${space})`;
        })
        .join(' OR ');
      cql = `${cql} AND (${cqlSpacesStr})`;
      cql = query ? `${cql} AND (text ~ "${query}")` : cql;
      params = {
        limit: maxResult, // number of item per page
        cql: cql,
        excerpt: 'highlight', // use "highlight" to enclosed word found in @@@hl@@@ and @@@endhl@@@
        expand: [
          // fields to retrieve
          'content.history',
          'content.metadata.labels',
          'content.body.styled_view',
        ].join(','),
      };
    }
    try {
      const results: AxiosResponse = await this.http
        .get(uriSearch, { params })
        .toPromise();
      this.logger.log(
        `Searching ${uriSearch} with ${maxResult} maximum results and CQL ${cql} or cursor ${cursorResults} via REST API`,
      );
      return results;
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
  async getAllPosts(spaceKey: string): Promise<AxiosResponse> {
    let cpl = `(type=blogpost)`;
    cpl = `${cpl} AND (label!=draft) AND (label=published)`;
    cpl = `${cpl} AND (space=${spaceKey})`;
    try {
      const results: AxiosResponse = await this.http
        .get('/wiki/rest/api/search', {
          params: {
            limit: 999,
            cql: cpl,
            expand: [
              // fields to retrieve
              'content.history',
              'content.metadata.labels',
              'content.body.styled_view',
            ].join(','),
          },
        })
        .toPromise();
      this.logger.log(`Retrieving all blog posts published in ${spaceKey}`);
      return results;
    } catch (err) {
      this.logger.log(err, 'error:getAllPosts');
      throw new HttpException(`error:getAllPosts > ${err}`, 404);
    }
  }

  /**
   * @function getAllSpaces Service
   * @description Retrieve all spaces from endpoint /wiki/rest/api/space
   * @return Promise {any}
   * @param type {string} 'global' - type of space with possible values 'global' or 'personal'
   * @param startAt {number} 15 - starting position to handle paginated results
   * @param maxResults {number} 999 - limit of results to be returned
   * @param getFields {number} 1 - '1' to get icon, labels, description and permissions or '0' for simple list of spaces
   */
  async getAllSpaces(
    type = 'global',
    startAt = 0,
    maxResults = 999,
    getFields = 0,
  ): Promise<AxiosResponse> {
    const defaultParms = {
      type: type,
      start: startAt,
      limit: maxResults,
      status: 'current',
    };

    // we expand extra fields if fields === 1 otherwise retrieve the default reponse
    const params =
      getFields === 1
        ? {
            ...defaultParms,
            expand: [
              // extra fields to retrieve
              'icon',
              'metadata.labels',
              'description.plain',
              'permissions',
            ].join(','),
          }
        : defaultParms;

    try {
      const results: AxiosResponse = await this.http
        .get('/wiki/rest/api/space', { params })
        .toPromise();
      this.logger.log(
        `Retrieving all spaces of type ${type} with ${maxResults} maximum records via REST API`,
      );
      return results;
    } catch (err: any) {
      this.logger.log(err, 'error:getAllSpaces');
      throw new HttpException(`error:getAllSpaces > ${err}`, 404);
    }
  }
}
