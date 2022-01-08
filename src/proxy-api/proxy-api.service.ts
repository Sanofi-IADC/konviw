import { Injectable, Logger } from '@nestjs/common';
import { ContextService } from '../context/context.service';
import { ConfigService } from '@nestjs/config';
import { ConfluenceService } from '../confluence/confluence.service';
import { JiraService } from 'src/jira/jira.service';
import parseHeaderBlog from './steps/parseHeaderBlog';
import {
  SearchResults,
  ResultsContent,
} from '../confluence/confluence.interface';
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
  ) {}

  /**
   * @function getSearchResults Service
   * @description Search content in Confluence
   * @return Promise {string}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param query {string} 'vision factory' - words to be searched
   * @param type {string} 'blogpost' - type of Confluence page, either 'page' or 'blogpost'
   * @param maxResults {number} '15' - limit of records to be retrieved
   * @param cursorResults {string} 'URI' - one of the two URIs provided by Confluence to navigate to the next or previous set of records
   */
  async getSearchResults(
    spaceKey: string,
    query = undefined,
    type = undefined,
    maxResults = 999,
    cursorResults = '',
  ): Promise<KonviwResults> {
    // destructuring data gets implicity typed from the response
    // while we explicitly type it for better control
    const { data }: { data: SearchResults } = await this.confluence.Search(
      spaceKey,
      query,
      type,
      maxResults,
      cursorResults,
    );
    const baseURL = this.config.get('confluence.baseURL');
    const baseHost = this.config.get('web.baseHost');
    const basePath = this.config.get('web.basePath');

    const parseResults: KonviwContent[] = data.results.map(
      (doc: ResultsContent) => {
        this.context.Init(spaceKey, doc.content.id);
        const atlassianIadcRegEx = new RegExp(`${baseURL}/wiki/`);
        parseHeaderBlog(doc.content.body.view.value)(this.context);
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
          imgblog: this.context
            .getImgBlog()
            .replace(atlassianIadcRegEx, `${baseHost}${basePath}/wiki/`),
          summary: doc.excerpt,
          space: doc.resultGlobalContainer.displayUrl.split('/')[2],
          lastModified: doc.friendlyLastModified,
          excerptBlog: this.context.getExcerpt(),
          body: this.context.getTextBody(),
          readTime: this.context.getReadTime(),
        };
        return contentResult;
      },
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
   * @function getJiraProjectCategories Service
   * @description Retrieve all Jira project categories
   * @return Promise {string}
   * @param server {string} 'System Jira' - Jira server to list categories from
   */
  async getJiraProjectCategories(server: string): Promise<any> {
    const { data }: any = await this.jira.findProjectCategories(server);

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

    const { data }: any = await this.confluence.Spaces(
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
}
