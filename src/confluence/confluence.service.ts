import {
  Logger,
  HttpException,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios'; // eslint-disable-line import/no-extraneous-dependencies
import { firstValueFrom } from 'rxjs';
import {
  Content,
  SearchResults,
  Attachment,
} from './confluence.interface';

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
   * @param version {string} '9' - id of the page to retrieve
   * @param status {string} 'current' - use 'current' or nothing for published pages and 'draft' for pages in DRAFT not yet published
   */
  async getPage(
    spaceKey: string,
    pageId: string,
    version?: string,
    status?: string,
  ): Promise<Content> {
    try {
      const [typeContentResponse, spaceContentResponse]: AxiosResponse[] = await Promise.all([
        firstValueFrom(
          this.http.post('/wiki/api/v2/content/convert-ids-to-types', { contentIds: [pageId] }),
        ),
        firstValueFrom(
          this.http.get(`/wiki/api/v2/spaces?keys=${spaceKey}`),
        ),
      ]);

      const spaceContent = this.getSpaceContent(spaceContentResponse);
      const contentType = this.getApiEndPoint(typeContentResponse, pageId);

      if (contentType) {
        const params = {
          version,
          status: status ?? 'current',
        };

        if (spaceContent) {
          params['space-id'] = spaceContent.id;
        }

        const getPageContentByFormats = async () => {
          const [viewFormat, storageFormat] = await Promise.all([
            firstValueFrom(
              this.http.get<any>(`/wiki/api/v2/${contentType}/${pageId}`, { params: { ...params, 'body-format': 'view' } }),
            ),
            firstValueFrom(
              this.http.get<any>(`/wiki/api/v2/${contentType}/${pageId}`, { params: { ...params, 'body-format': 'storage' } }),
            ),
          ]);
          return { ...viewFormat.data, body: { ...viewFormat.data.body, ...storageFormat.data.body } };
        };

        const getPageContentByArea = async (area: string) => {
          const { data } = await firstValueFrom(
            this.http.get<any>(`/wiki/api/v2/${contentType}/${pageId}/${area}`, { params }),
          );
          return data;
        };

        const [pageContent, labelsContent, propertiesContent] = await Promise.all([
          getPageContentByFormats(),
          getPageContentByArea('labels'),
          getPageContentByArea('properties'),
        ]);

        const [authorContent, versionAuthorContent] = await Promise.all([
          this.getAccountDataById(pageContent.authorId),
          this.getAccountDataById(pageContent.version.authorId),
        ]);

        const convertedPagePropertiesContentToObject = propertiesContent.results.reduce((acc, property) => {
          acc[property.key] = { ...property };
          return acc;
        }, {});

        const content = {
          pageContent,
          spaceContent: spaceContent ?? { key: spaceKey },
          labelsContent,
          propertiesContent: convertedPagePropertiesContentToObject,
          authorContent,
          versionAuthorContent,
        };

        // Check if the label defined in configuration for private pages is present in the metadata labels
        if (
          content.labelsContent.results.find(
            (label: { name: string }) =>
              label.name === this.config.get('konviw.private'),
          )
        ) {
          this.logger.log(`Page ${pageId} can't be rendered because is private`);
          throw new ForbiddenException('This page is private.');
        }
        return content as Content;
      }
      return undefined;
    } catch (err) {
      this.logger.log(err, 'error:getPage');
      throw new HttpException(`${err}\nPage ${pageId} Not Found`, 404);
    }
  }

  /**
   * @function getRedirectUrlForMedia Service
   * @description Route to retrieve the standard media files like images and videos (usually attachments)
   * @return Promise {string} 'url' - URL of the media to display
   * @param uri {string}
   */
  async getRedirectUrlForMedia(uri: string): Promise<string> {
    try {
      const results = await firstValueFrom(
        this.http.get(`/wiki/${uri}`, {
          maxRedirects: 0,
          validateStatus: (status) => status === 302,
        }),
      );
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
      cql = type ? `(type='${type}')` : '(type=blogpost OR type=page)';

      // draft documents or tag as private pages won't be included in the search
      cql = `${cql} AND (label!=draft) AND (label!='${this.config.get(
        'konviw.private',
      )}')`;

      // let's search additional labels while there may be multiple labels separated by ','
      const labelsList: string[] = labels?.split(',');
      if (labelsList?.length > 0) {
        const cqlLablelsStr = labelsList
          .map((label: any): string => `(label='${label}')`)
          .join(' AND ');
        cql = `${cql} AND (${cqlLablelsStr})`;
      }

      // there may be multiple spaces separated by '|' and a minimum of one space is mandatory
      const spacesList: string[] = spaceKeys.split('|');
      const cqlSpacesStr = spacesList
        .map((space: any): string => `(space=${space})`)
        .join(' OR ');
      cql = `${cql} AND (${cqlSpacesStr})`;

      // and finally let's add the searched term, if any
      cql = query ? `${cql} AND (text ~ "${query}")` : cql;
      params = {
        limit: maxResult, // number of item per page
        cql,
        excerpt: 'highlight', // use "highlight" to enclosed word found in @@@hl@@@ and @@@endhl@@@
        expand: [
          // fields to retrieve
          'content.history',
          'content.metadata.labels',
          'content.body.view',
          'content.version',
          // header image if any defined
          'content.metadata.properties.cover_picture_id_published',
        ].join(','),
        includeArchivedSpaces: false,
      };
    }
    try {
      const results: AxiosResponse<SearchResults> = await firstValueFrom(
        this.http.get<SearchResults>(uriSearch, { params }),
      );
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
      type,
      start: startAt,
      limit: maxResults,
      status: 'current',
    };

    // we expand extra fields if fields === 1 otherwise retrieve the default reponse
    const params = getFields === 1
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
      const results: AxiosResponse = await firstValueFrom(
        this.http.get('/wiki/rest/api/space', { params }),
      );
      this.logger.log(
        `Retrieving all spaces of type ${type} with ${maxResults} maximum records via REST API`,
      );
      return results;
    } catch (err: any) {
      this.logger.log(err, 'error:getAllSpaces');
      throw new HttpException(`error:getAllSpaces > ${err}`, 404);
    }
  }

  /**
   * @function getSpaceMetadata Service
   * @description Retrieve space metadata from endpoint /wiki/rest/api/space
   * @return Promise {any}
   * @param spaceKey {string} name of space
   */
  async getSpaceMetadata(
    spaceKey: string,
  ): Promise<AxiosResponse> {
    const defaultParms = {
      status: 'current',
    };

    // we expand extra fields
    const params = {
      ...defaultParms,
      expand: [
        'icon',
        'homepage',
      ].join(','),
    };

    try {
      const result: AxiosResponse = await firstValueFrom(
        this.http.get(`/wiki/rest/api/space/${spaceKey}`, { params }),
      );
      this.logger.log(
        `Retrieving ${spaceKey} space metadata via REST API`,
      );
      return result;
    } catch (err: any) {
      this.logger.log(err, 'error:getSpaceMetadata');
      throw new HttpException(`error:getSpaceMetadata > ${err}`, 404);
    }
  }

  async getAttachments(pageId: string): Promise<Attachment[]> {
    // from API v2 we have to use first this API to identify the proper content from the pageID
    const typeContentResponse: AxiosResponse = await firstValueFrom(
      this.http.post('/wiki/api/v2/content/convert-ids-to-types', { contentIds: [pageId] }),
    );
    const contentType = this.getApiEndPoint(typeContentResponse, pageId);
    if (contentType) {
      try {
        const results: AxiosResponse = await firstValueFrom(
          this.http.get(`/wiki/api/v2/${contentType}/${pageId}/attachments`),
        );
        this.logger.log(`Retrieving attachments from ${contentType} ${pageId} via REST API v2`);
        return results.data?.results;
      } catch (err: any) {
        this.logger.log(err, `error:getAttachments from ${contentType} ${pageId}`);
        return undefined;
      }
    }
    return undefined;
  }

  async getSpecialAtlassianIcons(image?: string): Promise<any> {
    const response: AxiosResponse = await firstValueFrom(
      this.http.get<Content>(
        '/gateway/api/emoji/atlassian?scale=XHDPI&altScale=XXXHDPI&preferredRepresentation=IMAGE',
      ),
    );
    const results = response.data?.emojis ?? [];
    if (image) {
      return results.find(({ id }) => id === image);
    }
    return results;
  }

  private async getAccountDataById(accountId: string): Promise<any> {
    const { data } = await firstValueFrom(
      this.http.get<Content>(`wiki/rest/api/user?accountId=${accountId}`),
    );
    return data;
  }

  /* eslint-disable class-methods-use-this */
  private getSpaceContent(spaceContentResponse): any {
    return spaceContentResponse.data.results[0];
  }

  /* eslint-disable class-methods-use-this */
  private getApiEndPoint(typeContent: any, pageId: string): string {
    return typeContent?.data.results[pageId] === 'page' ? 'pages' : 'blogposts';
  }
}
