import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ContextService } from '../context/context.service';
import {
  Content,
  SearchResults,
  ResultsContent,
} from '../confluence/confluence.interface';
import { ConfluenceService } from '../confluence/confluence.service';
import { JiraService } from '../jira/jira.service';
import getExcerptAndHeaderImage from './steps/getExcerptAndHeaderImage';
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
import fixCode from '../proxy-page/steps/fixCode';
import addCopyLinks from '../proxy-page/steps/addCopyLinks';
import addJira from '../proxy-page/steps/addJira';
import addAuthorVersion from '../proxy-page/steps/addAuthorVersion';

import {
  KonviwContent,
  KonviwResults,
  MetadataSearch,
} from './proxy-api.interface';

@Injectable()
export class ProxyApiService {
  private readonly logger = new Logger(ProxyApiService.name);

  constructor(
    private config: ConfigService,
    private confluence: ConfluenceService,
    private jira: JiraService,
    private context: ContextService,
    private readonly http: HttpService,
  ) {}

  /**
   * @function getSearchResults Service
   * @description Search content in Confluence
   * @return Promise {string}
   * @param spaceKeys {string} 'iadc|dgbi' - space key where the page belongs
   * @param query {string} 'vision factory' - words to be searched
   * @param type {string} 'blogpost' - type of Confluence page, either 'page' or 'blogpost'
   * @param labels {string} 'label1,label2' - labels to include as filters in the search
   * @param maxResults {number} '15' - limit of records to be retrieved
   * @param cursorResults {string} 'URI' - one of the two URIs provided by Confluence to navigate to the next or previous set of records
   */
  async getSearchResults(
    spaceKeys: string,
    query = undefined,
    type = undefined,
    labels = undefined,
    maxResults = 999,
    cursorResults = '',
  ): Promise<KonviwResults> {
    // destructuring data gets implicity typed from the response
    // while we explicitly type it for better control
    const { data }: { data: SearchResults } = await this.confluence.Search(
      spaceKeys,
      query,
      type, // 'page' or 'blogpost'
      labels,
      maxResults,
      cursorResults,
    );
    const baseURL = this.config.get('confluence.baseURL');
    const baseHost = this.config.get('web.baseHost');
    const basePath = this.config.get('web.basePath');

    const parseResults: KonviwContent[] = await Promise.all(
      data.results.map(async (doc: ResultsContent) => {
        const spacekey = doc.resultGlobalContainer.displayUrl.split('/')[2];
        const context = new ContextService(this.config);
        context.initPageContext(
          spacekey,
          doc.content.id,
          undefined, // theme
          type, // 'page' or 'blogpost'
          undefined, // data
          doc.content,
        );
        context.setHtmlBody(doc.content.body.view.value);
        const atlassianIadcRegEx = new RegExp(`${baseURL}/wiki/`);
        await getExcerptAndHeaderImage(this.config, this.confluence)(context);
        const contentResult: KonviwContent = {
          docId: doc.content.id,
          title: doc.content.title,
          type: doc.content.type,
          url: `${baseHost}${basePath}/wiki/spaces/iadc/pages/${doc.content.id}?type=blog`,
          createdAt: doc.content.history.createdDate,
          createdBy: doc.content.history.createdBy.displayName,
          createdByAvatar: doc.content.history.createdBy.profilePicture.path
            ? `${baseHost}${basePath}/${doc.content.history.createdBy.profilePicture.path.replace(
              /^\/wiki/,
              'wiki',
            )}`
            : '',
          createdByEmail: doc.content.history.createdBy.email,
          labels: doc.content.metadata.labels.results.map((list: any) => ({
            tag: list.label,
          })),
          imgblog: context
            .getImgBlog()
            .replace(atlassianIadcRegEx, `${baseHost}${basePath}/wiki/`),
          summary: doc.excerpt,
          space: spacekey,
          lastModified: doc.friendlyLastModified,
          excerptBlog: context.getExcerpt(),
          body: context.getTextBody(),
          readTime: context.getReadTime(),
        };
        return contentResult;
      }),
    );

    const meta: MetadataSearch = {
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
   * @function getJiraProjects Service
   * @description Retrieve Jira projects
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
    const { data }: any = await this.jira.findProjects(
      server,
      search,
      startAt,
      maxResults,
      categoryId,
    );

    const parseResults = data.values.map((project: any) => ({
      id: project.id,
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
    }));

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
   * @function getJiraProjectCategories Service
   * @description Retrieve all Jira project categories
   * @return Promise {string}
   * @param server {string} 'System Jira' - Jira server to list categories from
   */
  async getJiraProjectCategories(server: string): Promise<any> {
    const { data }: any = await this.jira.findProjectCategories(server);

    const parseResults = data.map((category: any) => ({
      id: category.id,
      name: category.name,
      description: category.description ?? '',
    }));

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
   * @function getJiraProjectIssues Service
   * @description Retrieve all Jira project Issues
   * @return Promise {string}
   * @param server {string} 'System Jira' - Jira server to list Issues from
   * @param jqlSearch {string} 'iadc' - word to be searched
   * @param fields {string} 'fields=field1,field2&fields=field3' - A list of fields to return for each issue
   * @param maxResult {number} 100 - maximum number of issues retrieved
   * @param startAt {number} 15 - starting position to handle paginated results
   */
  async getJiraProjectIssues(
    server: string,
    jqlSearch: string,
    fields: string,
    startAt: number,
    maxResults: number,
  ): Promise<any> {
    const {
      total, issues,
    }: any = await this.jira.findTickets(
      server,
      jqlSearch,
      fields,
      startAt,
      maxResults,
    );
    const parseResults = issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      selfUri: issue.self,
      fields: Object.keys(issue.fields).reduce((acc, curr) => {
        if (issue.fields[curr] !== null) {
          acc[curr] = issue.fields[curr];
        }
        return acc;
      }, {}),
    }));

    const meta = {
      totalSize: total,
      server,
    };

    return {
      meta,
      issues: parseResults,
    };
  }

  /**
   * @function getJiraProjectIssueTypesWithStatus Service
   * @description Retrieve all Jira project Issues
   * @return Promise {string}
   * @param server {string} 'System Jira' - Jira server to list Issues from
   * @param projectKey {string} FACTSWT - Jira project key
   */
  async getJiraProjectIssueTypesWithStatus(
    server: string,
    projectKey: string,
  ): Promise<any> {
    const { data }: any = await this.jira.findProjectIssueTypesWithStatus(
      server,
      projectKey,
    );
    const parseResults = data.map((issueTypeWithStatus: any) => ({
      id: issueTypeWithStatus.id,
      name: issueTypeWithStatus.name,
      subtask: issueTypeWithStatus.subtask,
      statuses: issueTypeWithStatus.statuses,
    }));

    const meta = {
      totalSize: parseResults.length,
      server,
      projectKey,
    };

    return {
      meta,
      issueTypeWithStatuses: parseResults,
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

    const { data }: any = await this.confluence.Spaces(
      type,
      startAt,
      maxResults,
      getFields,
    );

    const parseResults = data.results.map((space: any) => {
      const labels = space.metadata === undefined
        ? []
        : space.metadata.labels.results.map((label: any) => label.name);

      const permissions = space.permissions === undefined
        ? []
        : space.permissions.reduce((permissionsTmp, permission) => {
          if (permission.subjects?.user) {
            if (
              permission.subjects.user.results[0].accountType
                  === 'atlassian'
            ) {
              const name = permission.subjects.user.results[0].displayName;
              const avatar = `${baseHost}${basePath}${permission.subjects.user.results[0].profilePicture.path}`;
              const { operation } = permission;
              permissionsTmp.push({ name, avatar, operation });
            }
          }
          return permissionsTmp;
        }, []);

      const icon = space.icon === undefined
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
   * Function getPage
   *
   * @description Returns a JSON KonviwContent object containing page content
   * @return Promise {Partial<KonviwContent>}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   * @param type {string} 'blog' - type of the page
   */
  async getPage(
    spaceKey: string,
    pageId: string,
    type: string,
  ): Promise<Partial<KonviwContent>> {
    const content: Content = await this.confluence.getPage(spaceKey, pageId);
    this.context.initPageContext(spaceKey, pageId, undefined, type, undefined, content, false);
    // TODO: check whether we could add the excerpt and image header image also to the API metadata
    // await getExcerptAndHeaderImage(this.config, this.confluence)(this.context);
    const addJiraPromise = addJira(this.config, this.jira)(this.context);
    fixContentWidth()(this.context);
    await fixLinks(this.config, this.http, this.jira)(this.context);
    fixToc()(this.context);
    await fixEmojis(this.config, this.confluence)(this.context);
    fixDrawio(this.config)(this.context);
    fixChart(this.config)(this.context);
    fixExpander()(this.context);
    fixUserProfile()(this.context);
    fixVideo()(this.context);
    fixTableColGroup()(this.context);
    fixEmptyLineIncludePage()(this.context);
    fixRoadmap(this.config)(this.context);
    addAuthorVersion()(this.context);
    delUnnecessaryCode()(this.context);
    fixCode()(this.context);
    addCopyLinks()(this.context);
    await addJiraPromise;
    this.context.Close();
    return {
      body: this.context.getHtmlBody(),
      title: this.context.getTitle(),
      createdBy: this.context.getAuthor(),
      readTime: this.context.getReadTime(),
      createdAt: this.context.getWhen(),
      createdAtFriendly: this.context.getFriendlyWhen(),
      excerptBlog: this.context.getExcerpt(),
      docId: this.context.getPageId(),
      createdByAvatar: this.context.getAvatar(),
      createdByEmail: this.context.getEmail(),
      imgblog: this.context.getImgBlog(),
      space: this.context.getSpaceKey(),
    };
  }
}
