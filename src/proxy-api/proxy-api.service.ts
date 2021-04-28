import { Injectable, Logger } from '@nestjs/common';
import { ConfluenceService } from '../confluence/confluence.service';
import { ContextService } from '../context/context.service';
import { ConfigService } from '@nestjs/config';
import Config from '../config/config.d';
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
    const data = await this.confluence.getAllPosts(spaceKey);
    const baseURL = this.config.get<Config>('confluence.baseURL');
    const baseHost = this.config.get<Config>('web.baseHost');
    const basePath = this.config.get<Config>('web.basePath');

    return data.results.map((doc: any) => {
      this.context.Init(spaceKey, doc.content.id);
      const atlassianIadcRegEx = new RegExp(`${baseURL}/wiki/`);
      parseHeaderBlog(doc.content.body.styled_view.value)(this.context);
      return {
        docId: doc.content.id,
        title: doc.content.title,
        url: doc.content.id
          ? `${baseHost}${basePath}wiki/spaces/iadc/pages/${doc.content.id}?type=blog`
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
   * @function getSearchResults Service
   * @return Promise {string}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param query {string} 'vision factory' - words to be searched
   */
  async getSearchResults(spaceKey: string, query: string): Promise<string> {
    const data = await this.confluence.getResults(spaceKey, query);
    const baseURL = this.config.get<Config>('confluence.baseURL');
    const baseHost = this.config.get<Config>('web.baseHost');
    const basePath = this.config.get<Config>('web.basePath');

    const parseResults = data.results.map((doc: any) => {
      this.context.Init(spaceKey, doc.content.id); //// TODO
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

    const summary = {
      limit: data.limit,
      size: data.size,
      totalSize: data.totalSize,
      query: data.cqlQuery,
    };

    const combined = {
      summary,
      results: parseResults,
    };

    return JSON.parse(JSON.stringify(combined));
    // return combined;  // why this is not working?
  }
}
