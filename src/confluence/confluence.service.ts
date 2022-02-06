import {
  Logger,
  HttpException,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { Content, SearchResults } from './confluence.interface';

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
  async getPage(
    spaceKey: string,
    pageId: string,
  ): Promise<AxiosResponse<Content>> {
    let results: AxiosResponse<Content>;
    try {
      this.logger.log(`Retrieving page ${pageId}`);
      results = await this.http
        .get<Content>(`/wiki/rest/api/content/${pageId}`, {
          params: {
            type: 'page',
            spaceKey,
            expand: [
              // fields to retrieve
              'body.view',
              'metadata.properties.content_appearance_published',
              'metadata.labels',
              'version',
              'history',
            ].join(','),
          },
        })
        .toPromise();
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
   * @function Search Service
   * @description Search results from Confluence API /rest/api/search
   * @return Promise {any}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param query {string} - space key identifying the document space from Confluence
   * @param type {string} 'blogpost' - type of Confluence page, either 'page' or 'blogpost'
   * @param labels {string} 'label1,label2' - labels to include as filters in the search
   * @param maxResults {number} '15' - limit of records to be retrieved
   * @param cursorResults {string} 'URI' - one of the two URIs provided by Confluence to navigate to the next or previous set of records
   */
  async Search(
    spaceKeys: string,
    query = undefined,
    type = undefined,
    labels = undefined,
    maxResult = 999,
    cursorResults = '',
  ): Promise<AxiosResponse<SearchResults>> {
    let uriSearch: string;
    let params: any = {};
    let cql: string;
    if (cursorResults !== '') {
      uriSearch = `/wiki${cursorResults}`;
    } else {
      uriSearch = '/wiki/rest/api/search';
      // filter by the type received or search both blogposts and pages
      cql = type ? `(type='${type}')` : `(type=blogpost OR type=page)`;

      // draft documents or tag as private pages won't be included in the search
      cql = `${cql} AND (label!=draft) AND (label!='${this.config.get(
        'konviw.private',
      )}')`;

      // let's search additional labels while there may be multiple labels separated by ','
      const labelsList: string[] = labels?.split(',');
      if (labelsList?.length > 0) {
        const cqlLablelsStr = labelsList
          .map((label: any): string => {
            return `(label='${label}')`;
          })
          .join(' AND ');
        cql = `${cql} AND (${cqlLablelsStr})`;
      }

      // there may be multiple spaces separated by '|' and a minimum of one space is mandatory
      const spacesList: string[] = spaceKeys.split('|');
      const cqlSpacesStr = spacesList
        .map((space: any): string => {
          return `(space=${space})`;
        })
        .join(' OR ');
      cql = `${cql} AND (${cqlSpacesStr})`;

      // and finally let's add the searched term, if any
      cql = query ? `${cql} AND (text ~ "${query}")` : cql;
      params = {
        limit: maxResult, // number of item per page
        cql: cql,
        excerpt: 'highlight', // use "highlight" to enclosed word found in @@@hl@@@ and @@@endhl@@@
        expand: [
          // fields to retrieve
          'content.history',
          'content.metadata.labels',
          'content.body.view',
        ].join(','),
        includeArchivedSpaces: false,
      };
    }
    try {
      const results: AxiosResponse<SearchResults> = await this.http
        .get<SearchResults>(uriSearch, { params })
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
   * @function getAllSpaces Service
   * @description Retrieve all spaces from endpoint /wiki/rest/api/space
   * @return Promise {any}
   * @param type {string} 'global' - type of space with possible values 'global' or 'personal'
   * @param startAt {number} 15 - starting position to handle paginated results
   * @param maxResults {number} 999 - limit of results to be returned
   * @param getFields {number} 1 - '1' to get icon, labels, description and permissions or '0' for simple list of spaces
   */
  async Spaces(
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
