import {
  Logger,
  HttpException,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig, AxiosResponse } from 'axios'; // eslint-disable-line import/no-extraneous-dependencies
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
        this.getContentType(pageId),
        this.getSpaceData(spaceKey),
      ]);

      const spaceContent = this.getSpaceContent(spaceContentResponse);
      const contentType = this.getApiEndPoint(typeContentResponse, pageId);

      if (contentType) {
        const params = { version };

        params['space-id'] = spaceContent?.id ?? null;
        // get-draft parameter expected by the new API v2
        // https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/#api-pages-id-get
        params['get-draft'] = (status === 'draft');

        const [pageContent, labelsContent, propertiesContent] = await Promise.all([
          this.getContentTypeBody(contentType, pageId, params),
          this.getContentTypeResource(contentType, pageId, 'labels', params),
          this.getContentTypeResource(contentType, pageId, 'properties', params),
        ]);

        const [authorContent, versionAuthorContent] = await Promise.all([
          this.getAccountDataById((pageContent as Content['pageContent']).ownerId
          ?? (pageContent as Content['pageContent']).authorId),
          this.getAccountDataById((pageContent as Content['pageContent']).version.authorId),
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
   * @function getSpacePermissions Service
   * @description Get Space permissions from Confluence API /wiki/api/v2/spaces/:id/permissions
   * @return Promise {any}
   * @param id {string} '1' - space id
   * @param limit {number} '50'- maximum number of records to retrieve
   */
  async getSpacePermissions(id: string, limit = 50) {
    try {
      const { data }: AxiosResponse = await firstValueFrom(
        this.http.get(`/wiki/api/v2/spaces/${id}/permissions`, { params: { limit } }),
      );
      const results = await this.getSpacesAccountByPermissions(data.results);
      this.logger.log(
        `Retrieving space permissions of ${id} via REST API`,
      );
      return results;
    } catch (err: any) {
      this.logger.log(err, 'error:getSpacePermissions');
      throw new HttpException(`error:getSpacePermissions > ${err}`, 404);
    }
  }

  /**
   * @function getSpaceLabels Service
   * @description Get Space labels from Confluence API /wiki/api/v2/spaces/:id/labels
   * @return Promise {any}
   * @param id {string} '1' - space id
   * @param limit {number} '50' - maximum number of records to retrieve
   */
  async getSpaceLabels(id: string, limit = 50) {
    try {
      const { data }: AxiosResponse = await firstValueFrom(
        this.http.get(`/wiki/api/v2/spaces/${id}/labels`, { params: { limit } }),
      );
      this.logger.log(
        `Retrieving space labels of ${id} via REST API`,
      );
      return data.results;
    } catch (err: any) {
      this.logger.log(err, 'error:getSpaceLabels');
      throw new HttpException(`error:getSpaceLabels > ${err}`, 404);
    }
  }

  /**
   * @function getSpacesMeta Service
   * @description Get Space meta from Confluence API /wiki/api/v2/spaces
   * @return Promise {any}
   * @param type {string} 'global' - type of space with possible values 'global' or 'personal'
   * @param collection {array} '[]' - recursive array of collection
   * @param next {string} 'xyz' - starting cursor used for pagination
   */
  async getSpacesMeta(type: string, next?: string, collection = []) {
    const defaultParams = { type, status: 'current', limit: 250 };
    try {
      const { data }: AxiosResponse = await firstValueFrom(
        this.http.get(next || '/wiki/api/v2/spaces', { params: !next && defaultParams }),
      );
      this.logger.log(
        `Retrieving spaces of ${type} total via REST API`,
      );
      collection.push(...data.results);
      if (data._links?.next) {
        await this.getSpacesMeta(type, data._links?.next, collection);
      }
      return collection;
    } catch (err: any) {
      this.logger.log(err, 'error:getSpacesMeta');
      throw new HttpException(`error:getSpacesMeta > ${err}`, 404);
    }
  }

  /**
   * @function getAllSpaces Service
   * @description Retrieve all spaces from endpoint /wiki/rest/api/space
   * @return Promise {any}
   * @param type {string} 'global' - type of space with possible values 'global' or 'personal'
   * @param limit {number} '250' - maximum number of records to retrieve
   * @param next {string} 'xyz' - starting cursor used for pagination
   */
  async Spaces(
    type: string,
    limit: number,
    next: string,
  ): Promise<AxiosResponse> {
    const defaultParms = {
      type,
      limit,
      'include-icon': true,
      'description-format': 'plain',
      status: 'current',
    };

    try {
      const response : AxiosResponse = await firstValueFrom(
        this.http.get(next || '/wiki/api/v2/spaces', { params: !next && defaultParms }),
      );

      const results = await Promise.all(response.data.results.map(async (space) => {
        const [labels, permissions] = await Promise.all([
          this.getSpaceLabels(space.id),
          this.getSpacePermissions(space.id),
        ]);
        return {
          ...space,
          permissions,
          labels,
        };
      }));

      this.logger.log(
        `Retrieving all spaces of type ${type} with ${limit} maximum records via REST API`,
      );
      return { ...response, data: { ...response.data, results } };
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
    const params = {
      status: 'current',
      'include-icon': true,
      keys: spaceKey,
    };

    try {
      const result: AxiosResponse = await firstValueFrom(
        this.http.get('/wiki/api/v2/spaces', { params }),
      );
      this.logger.log(
        `Retrieving ${spaceKey} space metadata via REST API`,
      );
      return { ...result, data: result.data.results[0] };
    } catch (err: any) {
      this.logger.log(err, 'error:getSpaceMetadata');
      throw new HttpException(`error:getSpaceMetadata > ${err}`, 404);
    }
  }

  async getAttachments(pageId: string): Promise<Attachment[]> {
    // from API v2 we have to use first this API to identify the proper content from the pageID
    const typeContentResponse: AxiosResponse = await this.getContentType(pageId);
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

  async getAttachmentBase64(url: string): Promise<string> {
    try {
      const { data }: AxiosResponse = await firstValueFrom(
        this.http.get(`/wiki${url}`, { responseType: 'arraybuffer' }),
      );
      this.logger.log(`Retrieving attachmentBase64 from ${url} via REST API v2`);
      return data.toString('base64');
    } catch (err: any) {
      this.logger.log(err, `error:getAttachmentBase64 from ${url}`);
      return undefined;
    }
  }

  async getSpecialAtlassianIcons(image?: string): Promise<any> {
    const response: AxiosResponse = await firstValueFrom(
      this.http.get<Content>(
        '/gateway/api/emoji/atlassian?scale=XHDPI&altScale=XXXHDPI&preferredRepresentation=IMAGE',
      ),
    );
    const results = response.data?.emojis ?? [];
    if (image) {
      const imageData = results.find(({ id }) => id === image);
      const { imagePath } = imageData.representation;
      return imagePath;
    }
    return results;
  }

  async getSpecialUploadedIcons(image?: string): Promise<any> {
    const response: AxiosResponse = await firstValueFrom(
      // Special custom emojis are uploaded to a specific collection per site, so we set it up
      // via env variable emojiCollection
      this.http.get<Content>(
        `/gateway/api/emoji/${this.config.get('confluence.emojiCollection')}/site`
        + '?scale=XHDPI&altScale=XXXHDPI&preferredRepresentation=IMAGE',
      ),
    );
    // retrieve the custom uploaded emojis and image path
    const results = response.data?.emojis ?? [];
    // retrieve the metadata for retrieving the images from the media library, specially JWT token and client
    const meta = response.data?.meta ?? {};
    if (image) {
      const imageData = results.find(({ id }) => id === image);
      const baseImagePath = imageData.representation.imagePath;
      const imagePath = `${baseImagePath}&token=${meta.mediaApiToken.jwt}&client=${meta.mediaApiToken.clientId}`;

      return imagePath;
    }
    return response.data;
  }

  private async getSpacesAccountByPermissions(data) {
    const permissionsDefinedAsUser = data.filter((permission) => permission.principal.type === 'user');
    return Promise.all(permissionsDefinedAsUser.map(async (permission) => ({
      ...permission,
      user: await this.getAccountDataById(permission.principal.id),
    })));
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

  private async getSpaceData(spaceKey: string) {
    return firstValueFrom(
      this.http.get(`/wiki/api/v2/spaces?keys=${spaceKey}`),
    );
  }

  private async getContentType(pageId: string): Promise<any> {
    return firstValueFrom(
      this.http.post('/wiki/api/v2/content/convert-ids-to-types', { contentIds: [pageId] }),
    );
  }

  async getContentTypeBody(
    contentType: string,
    pageId: string,
    params: AxiosRequestConfig<any>['params'],
  ): Promise<Content['pageContent'] | Content> {
    const [viewFormat, storageFormat] = await Promise.all([
      firstValueFrom(
        this.http.get<any>(`/wiki/api/v2/${contentType}/${pageId}`, { params: { ...params, 'body-format': 'view' } }),
      ),
      firstValueFrom(
        this.http.get<any>(`/wiki/api/v2/${contentType}/${pageId}`, { params: { ...params, 'body-format': 'storage' } }),
      ),
    ]);
    return { ...viewFormat.data, body: { ...viewFormat.data.body, ...storageFormat.data.body } };
  }

  async getContentTypeResource(
    contentType: string,
    pageId: string,
    resource: string,
    params: AxiosRequestConfig<any>['params'],
  ): Promise<Content['labelsContent'] | Content['Properties']> {
    const { data } = await firstValueFrom(
      this.http.get<any>(`/wiki/api/v2/${contentType}/${pageId}/${resource}`, { params }),
    );
    return data;
  }

  /**
   * @function getCustomContentByTypeInSpace
   * @description Return custom content of specified type in the given space
   * @param type {string} - type of content to retrieve
   * @param spaceId {number} - id of the space to retrieve content from
   * @param next {string} - starting cursor used for pagination
   * @param collection {array} - recursive array of collection
   * @return Promise {any}
   */
  async getCustomContentsByTypeInSpace(
    type: string,
    spaceId: number,
    next?: string,
    collection = [],
  ): Promise<any> {
    const defaultParams = {
      type,
      limit: 250,
      'body-format': 'atlas_doc_format',
    };
    try {
      const { data }: AxiosResponse = await firstValueFrom(
        this.http.get(next || `/wiki/api/v2/spaces/${spaceId}/custom-content`, { params: !next && defaultParams }),
      );
      this.logger.log(
        `Retrieving Custom content of ${type} in Space ${spaceId} via REST API`,
      );
      collection.push(...data.results);
      if (data._links?.next) {
        await this.getSpacesMeta(type, data._links?.next, collection);
      }
      return collection;
    } catch (err: any) {
      this.logger.log(err, 'error:getCustomContentByTypeInSpace');
      throw new HttpException(`error:getCustomContentByTypeInSpace > ${err}`, 404);
    }
  }

  /**
   * @function getCustomContentById
   * @description Return custom content by id
   * @param id {number} id of the custom content to retrieve
   * @return Promise {any}
   * @throws {HttpException} if there is a problem with the request
   */
  async getCustomContentById(id: number): Promise<any> {
    try {
      const { data }: AxiosResponse = await firstValueFrom(
        this.http.get(`/wiki/api/v2/custom-content/${id}`),
      );
      this.logger.log(`Retrieving custom-content ${id} via REST API`);
      return data;
    } catch (err: any) {
      this.logger.log(err, `error:getCustomContentById ${id}`);
      throw new HttpException(`error:getCustomContentById > ${err}`, 404);
    }
  }

  /**
   * @function getAttchmentById
   * @description Return attachment info by id
   * @param id {string} id of the attachment to retrieve
   * @return Promise {any}
   * @throws {HttpException} if there is a problem with the request
   */
  async getAttachmentById(id: string): Promise<any> {
    try {
      const { data }: AxiosResponse = await firstValueFrom(
        this.http.get(`/wiki/api/v2/attachments/${id}`),
      );
      this.logger.log(`Retrieving attachment ${id} via REST API`);
      return data;
    } catch (err: any) {
      this.logger.log(err, `error:getAttchmentById ${id}`);
      throw new HttpException(`error:getAttchmentById > ${err}`, 404);
    }
  }
}
