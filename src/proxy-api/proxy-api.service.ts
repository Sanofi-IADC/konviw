import { Injectable, Logger } from '@nestjs/common';
import { ContextService } from '../context/context.service';
import { ConfigService } from '@nestjs/config';
import { ConfluenceService } from '../confluence/confluence.service';
import { JiraService } from 'src/jira/jira.service';
import parseHeaderBlog from './steps/parseHeaderBlog';
import fixContentWidth from '../proxy-page/steps/fixContentWidth';
import fixLinks from '../proxy-page/steps/fixLinks';
import fixToc from '../proxy-page/steps/fixToc';
import fixEmojis from '../proxy-page/steps/fixEmojis';
import fixExpander from '../proxy-page/steps/fixExpander';
import fixUserProfile from '../proxy-page/steps/fixUserProfile';
import fixVideo from '../proxy-page/steps/fixVideo';
import fixTableColGroup from '../proxy-page/steps/fixTableColGroup';
import fixEmptyLineIncludePage from '../proxy-page/steps/fixEmptyLineIncludePage';
import fixDrawio from '../proxy-page/steps/fixDrawio';
import fixChart from '../proxy-page/steps/fixChart';
import fixRoadmap from '../proxy-page/steps/fixRoadmap';
import delUnnecessaryCode from '../proxy-page/steps/delUnnecessaryCode';
import addHighlightjs from '../proxy-page/steps/addHighlightjs';
import addScrollToTop from '../proxy-page/steps/addScrollToTop';
import addReadingProgressBar from '../proxy-page/steps/addReadingProgressBar';
import addCopyLinks from '../proxy-page/steps/addCopyLinks';
import addJira from '../proxy-page/steps/addJira';

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
      parseHeaderBlog(doc.content.body.view.value)(this.context);
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
      parseHeaderBlog(doc.content.body.view.value)(this.context);
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

  /**
   * getJiraProjectCategories Service to retrieve Jira project categories
   *
   * @return Promise {string}
   * @param server {string} 'System Jira' - Jira server to list categories from
   */
  async getJiraProjectCategories(server: string): Promise<any> {
    const { data } = await this.jira.findProjectCategories(server);

    const parseResults = data.map((category: any) => {
      return {
        id: category.id,
        name: category.name,
        description: category.description ?? '',
      };
    });

    const meta = {
      totalSize: parseResults.length,
      server,
    };

    return {
      meta,
      categories: parseResults,
    };
  }

  /**
   * @function getAllSpaces Service
   * @description Retrieve all spaces from a Confluence server
   * @return Promise {any}
   * @param type {string} 'global' - type of space with possible values 'global' or 'personal'
   * @param startAt {number} 15 - starting position to handle paginated results
   * @param maxResults {number} 999 - limit of results to be returned
   * @param getFields {number} 1 - '1' to get icon, labels, description and permissions or '0' for simple list of spaces
   */
  async getAllSpaces(
    type: string,
    startAt: number,
    maxResults: number,
    getFields: number,
  ): Promise<any> {
    const baseHost = this.config.get('web.baseHost');
    const basePath = this.config.get('web.basePath');

    const { data } = await this.confluence.getAllSpaces(
      type,
      startAt,
      maxResults,
      getFields,
    );

    const parseResults = data.results.map((space: any) => {
      const labels =
        space.metadata === undefined
          ? []
          : space.metadata.labels.results.map((label: any) => {
              return label.name;
            });

      const permissions =
        space.permissions === undefined
          ? []
          : space.permissions.reduce((permissionsTmp, permission) => {
              if (permission.subjects?.user) {
                if (
                  permission.subjects.user.results[0].accountType ===
                  'atlassian'
                ) {
                  const name = permission.subjects.user.results[0].displayName;
                  const avatar = `${baseHost}${basePath}${permission.subjects.user.results[0].profilePicture.path}`;
                  const operation = permission.operation;
                  permissionsTmp.push({ name, avatar, operation });
                }
              }
              return permissionsTmp;
            }, []);

      const icon =
        space.icon === undefined
          ? undefined
          : `${baseHost}${basePath}/wiki${space.icon.path}`;

      return {
        id: space.id,
        key: space.key,
        name: space.name,
        description: space.description?.plain.value,
        icon,
        type: space.type,
        status: space.status,
        labels,
        permissions,
      };
    });

    const meta = {
      start: startAt,
      maxResults: data.limit,
      totalSize: data.size,
    };

    return {
      meta,
      spaces: parseResults,
    };
  }

  /**
   * Function buildPage Service
   *
   * @return Promise {string}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   * @param theme {string} 'dark' - light or dark theme used by the page
   * @param type {string} 'blog' - type of the page
   * @param style {string} 'iadc' - theme to style the page
   */
  async getPage(
    spaceKey: string,
    pageId: string,
    theme: string,
    type: string,
    style: string,
  ): Promise<any> {
    const { data } = await this.confluence.getPage(spaceKey, pageId);
    console.log(data);
    this.context.initPageContext(spaceKey, pageId, theme, style, data);
    const addJiraPromise = addJira(this.config, this.jira)(this.context);
    // fixHtmlHead(this.config)(this.context);
    fixContentWidth()(this.context);
    fixLinks(this.config)(this.context);
    fixToc()(this.context);
    fixEmojis(this.config)(this.context);
    fixDrawio(this.config)(this.context);
    fixChart(this.config)(this.context);
    fixExpander()(this.context);
    fixUserProfile()(this.context);
    fixVideo()(this.context);
    fixTableColGroup()(this.context);
    fixEmptyLineIncludePage()(this.context);
    fixRoadmap(this.config)(this.context);
    // fixFrameAllowFullscreen()(this.context);
    // if (type === 'blog') {
    //   addHeaderBlog()(this.context);
    // } else if (type !== 'notitle') {
    //   addHeaderTitle()(this.context);
    // }
    delUnnecessaryCode()(this.context);
    // addCustomCss(this.config, style)(this.context);
    // addMessageBus(this.config)(this.context);
    // if (nozoom == undefined) {
    //   addZooming(this.config)(this.context);
    //   addNoZoom()(this.context);
    // }
    // addHighlightjs(this.config)(this.context);
    // addTheme()(this.context);
    // addScrollToTop()(this.context);
    // addReadingProgressBar()(this.context);
    addCopyLinks()(this.context);
    // addWebStatsTracker(this.config)(this.context);
    await addJiraPromise;
    this.context.Close();
    return {
      html_body: this.context.getHtmlBody(),
      html_head: this.context.getHtmlHeader(),
      title: this.context.getTitle(),
      author: this.context.getAuthor(),
      read_time: this.context.getReadTime(),
      created_date: this.context.getWhen(),
      created_date_friendly: this.context.getFriendlyWhen(),
      excerpt: this.context.getExcerpt(),
      page_type: type,
    };
  }
}
