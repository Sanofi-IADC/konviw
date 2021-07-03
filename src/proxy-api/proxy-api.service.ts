import { Injectable, Logger } from '@nestjs/common';
import { ConfluenceService } from '../confluence/confluence.service';
import { ContextService } from '../context/context.service';
import { ConfigService } from '@nestjs/config';
import parseHeaderBlog from './steps/parseHeaderBlog';

@Injectable()
export class ProxyApiService {
  private readonly logger = new Logger(ProxyApiService.name);
  constructor(
    private config: ConfigService,
    private confluence: ConfluenceService,
    private context: ContextService,
  ) {}

  /**
   * @function getAllPosts Service
   * @return Promise {string}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   */
  async getAllPosts(spaceKey: string): Promise<any> {
    const { data } = await this.confluence.getAllPosts(spaceKey);
    const baseURL = this.config.get('confluence.baseURL');
    const baseHost = this.config.get('web.baseHost');
    const basePath = this.config.get('web.basePath');

    return data.results.map((doc: any) => {
      this.context.Init(spaceKey, doc.content.id);
      const atlassianIadcRegEx = new RegExp(`${baseURL}/wiki/`);
      parseHeaderBlog(doc.content.body.styled_view.value)(this.context);
      return {
        docId: doc.content.id,
        title: doc.content.title,
        url: doc.content.id
          ? `${baseHost}${basePath}/wiki/spaces/iadc/pages/${doc.content.id}?type=blog`
          : false,
        createdAt: doc.content.history.createdDate,
        createdBy: doc.content.history.createdBy.displayName,
        createdByAvatar: doc.content.history.createdBy.profilePicture.path
          ? `${baseHost}${basePath}/${doc.content.history.createdBy.profilePicture.path.replace(
              /^\/wiki/,
              'wiki',
            )}`
          : false,
        labels: doc.content.metadata.labels.results.map((list: any) => ({
          tag: list.label,
        })),
        summary: doc.excerpt,
        lastModified: doc.friendlyLastModified,
        excerptBlog: this.context.getExcerpt(),
        imgblog: this.context
          .getImgBlog()
          .replace(atlassianIadcRegEx, `${baseHost}${basePath}/wiki/`),
        body: this.context.getTextBody(),
        readTime: this.context.getReadTime(),
      };
    });
  }

  /**
   * getSearchResults Service to search content in Confluence
   *
   * @return Promise {string}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param query {string} 'vision factory' - words to be searched
   * @param maxResults {number} '15' - limit of records to be retrieved
   * @param cursorResults {string} 'URI' - one of the two URIs provided by Confluence to navigate to the next or previous set of records
   */
  async getSearchResults(
    spaceKey: string,
    query: string,
    maxResults: number,
    cursorResults: string,
  ): Promise<any> {
    const { data } = await this.confluence.getResults(
      spaceKey,
      query,
      maxResults,
      cursorResults,
    );
    const baseURL = this.config.get('confluence.baseURL');
    const baseHost = this.config.get('web.baseHost');
    const basePath = this.config.get('web.basePath');

    const parseResults = data.results.map((doc: any) => {
      this.context.Init(spaceKey, doc.content.id);
      const atlassianIadcRegEx = new RegExp(`${baseURL}/wiki/`);
      parseHeaderBlog(doc.content.body.styled_view.value)(this.context);
      return {
        docId: doc.content.id,
        title: doc.content.title,
        type: doc.content.type,
        url: doc.content.id
          ? `${baseHost}${basePath}/wiki/spaces/iadc/pages/${doc.content.id}?type=blog`
          : false,
        createdAt: doc.content.history.createdDate,
        createdBy: doc.content.history.createdBy.displayName,
        createdByAvatar: doc.content.history.createdBy.profilePicture.path
          ? `${baseHost}${basePath}${doc.content.history.createdBy.profilePicture.path.replace(
              /^\/wiki/,
              'wiki',
            )}`
          : false,
        createdByEmail: doc.content.history.email,
        labels: doc.content.metadata.labels.results.map((list: any) => ({
          tag: list.label,
        })),
        imgblog: this.context
          .getImgBlog()
          .replace(atlassianIadcRegEx, `${baseHost}${basePath}wiki/`),
        summary: doc.excerpt,
        space: doc.resultGlobalContainer.displayUrl.split('/')[2],
        lastModified: doc.friendlyLastModified,
        excerptBlog: this.context.getExcerpt(),
        body: this.context.getTextBody(),
        readTime: this.context.getReadTime(),
      };
    });

    const meta = {
      limit: data.limit,
      size: data.size,
      totalSize: data.totalSize,
      query: data.cqlQuery,
      next: data._links.next,
      prev: data._links.prev,
    };

    return {
      meta,
      results: parseResults,
    };
  }
}
