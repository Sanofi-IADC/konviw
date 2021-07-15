import { Injectable, Logger } from '@nestjs/common';
import { ContextService } from '../context/context.service';
import { ConfigService } from '@nestjs/config';
import { ConfluenceService } from '../confluence/confluence.service';
import { JiraService } from 'src/jira/jira.service';
import parseHeaderBlog from './steps/parseHeaderBlog';

@Injectable()
export class ProxyApiService {
  private readonly logger = new Logger(ProxyApiService.name);
  constructor(
    private config: ConfigService,
    private confluence: ConfluenceService,
    private jira: JiraService,
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

  /**
   * getJiraProjects Service to search content in Confluence
   *
   * @return Promise {string}
   * @param server {string} 'System Jira' - Jira server to list projects from
   * @param search {string} 'iadc' - word to be searched
   * @param startAt {number} 15 - starting position to handle paginated results
   */
  async getJiraProjects(
    server: string,
    search: string,
    startAt: number,
    maxResults: number,
    categoryId,
  ): Promise<any> {
    const { data } = await this.jira.findProjects(
      server,
      search,
      startAt,
      maxResults,
      categoryId,
    );

    const parseResults = data.values.map((project: any) => {
      return {
        key: project.key,
        name: project.name,
        description: project.description,
        avatar48: project.avatarUrls['48x48'],
        avatar24: project.avatarUrls['24x24'],
        categoryId: (project.projectCategory ?? '').id,
        categoryName: (project.projectCategory ?? '').name,
        categoryDescription: (project.projectCategory ?? '').descriptiom,
        projectType: project.projectTypeKey,
        projectStyle: project.style,
        leadId: project.lead.accountId,
        leadName: project.lead.displayName,
        leadActive: project.lead.active,
        leadAvatar48: project.lead.avatarUrls['48x48'],
        leadAvatar24: project.lead.avatarUrls['24x24'],
        totalIssueCount: project.insight.totalIssueCount,
        lastIssueUpdateTime: project.insight.lastIssueUpdateTime,
      };
    });

    const meta = {
      maxResults: data.maxResults,
      totalSize: data.total,
      server,
      search,
      next: data.self,
      prev: data.nextPage,
    };

    return {
      meta,
      projects: parseResults,
    };
  }
}
