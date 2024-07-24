import {
  Controller, Get, Logger, Param, Query, Version,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  PageParamsDTO,
  PageQueryDTO,
} from '../proxy-page/proxy-page.validation.dto';
import { ProxyApiService } from './proxy-api.service';
import {
  PostsParamsDTO,
  SearchQueryDTO,
  SearchProjectsQueryDTO,
  SearchProjectCategoriesQueryDTO,
  SearchProjectIssuesQueryDTO,
  GetSpacesParamsDTO,
  GetSpacesQueryDTO,
} from './proxy-api.validation.dto';
import { FixVersion, KonviwResults } from './proxy-api.interface';
import SearchProjectIssueTypesWithStatusQueryDTO from './dto/SearchProjectIssueTypesWithStatusQuery';
import GetScreenDetailsDTO from './dto/GetScreenDetailsQuery';
import SearchProjectUsersQueryDTO from './dto/SearchProjectUsersQuery';
import SearchProjectVersionsQueryDTO from './dto/SearchProjectVersionsQuery';
import GetSpacesMetaParamsDTO from './dto/GetSpacesMetaParams';

@ApiTags('proxy-api')
@Controller('api')
export class ProxyApiController {
  constructor(private readonly proxyApi: ProxyApiService) {}

  private readonly logger = new Logger(ProxyApiController.name);

  /**
   * @GET (controller) api/BlogPosts/:spaceKey
   * @description Route to retrieve the list of blog posts in a given spaceKey
   * @return {string} 'JSON' - JSON with Blog Posts content and metadata
   */
  @ApiOkResponse({ description: 'All blog posts from a given space key' })
  @Get('BlogPosts/:spaceKey')
  async getBlogPosts(@Param() params: PostsParamsDTO): Promise<KonviwResults> {
    return this.proxyApi.getSearchResults(
      params.spaceKey,
      undefined,
      'blogpost',
    );
  }

  /**
   * @GET (controller) api/search
   * @description Route to retrieve the list of Confluence pages matching a given criteria
   * @return {string} 'JSON' - JSON with searched pages and metadata
   */
  @ApiOkResponse({
    description: 'All pages that matches the given search string and filters',
  })
  @Get('search')
  async getSearchResults(
    @Query() queries: SearchQueryDTO,
  ): Promise<KonviwResults> {
    return this.proxyApi.getSearchResults(
      queries.spaceKey,
      queries.query,
      queries.type,
      queries.labels,
      queries.maxResults,
      queries.cursorResults,
    );
  }

  /**
   * @GET (controller) api/projects
   * @description Route to retrieve the Jira projects matching the filter criteria
   * @return {string} 'JSON' - JSON with the list of Jira projects
   */
  @ApiOkResponse({
    description:
      'List projects from a Jira server that matches the given search string',
  })
  @Get('projects')
  async getJiraProjects(
    @Query() queries: SearchProjectsQueryDTO,
  ): Promise<any> {
    return this.proxyApi.getJiraProjects(
      queries.server,
      queries.search,
      queries.startAt,
      queries.maxResults,
      queries.categoryId,
      queries.reader,
    );
  }

  /**
   * @GET (controller) api/projects/categories
   * @description Route to retrieve the list of project categories from a Jira server
   * @return {string} 'JSON' - JSON with the list of Jira project categories
   */
  @ApiOkResponse({
    description: 'List project categories from a Jira server',
  })
  @Get('projects/categories')
  async getJiraProjectCategories(
    @Query() queries: SearchProjectCategoriesQueryDTO,
  ): Promise<any> {
    return this.proxyApi.getJiraProjectCategories(queries.server);
  }

  /**
   * @GET (controller) api/projects/issues
   * @description Route to retrieve the list of project issues from a Jira server
   * @return {string} 'JSON' - JSON with the list of Jira project issues
   */
  @ApiOkResponse({
    description: 'List project issues from a Jira server using JQL',
  })
  @Get('projects/issues')
  async getJiraProjectIssues(
    @Query() queries: SearchProjectIssuesQueryDTO,
  ): Promise<any> {
    return this.proxyApi.getJiraProjectIssues(
      queries.server,
      queries.jqlSearch,
      queries.fields,
      queries.startAt,
      queries.maxResults,
      queries.reader,
    );
  }

  /**
   * @GET (controller) api/projects/statuses
   * @description Route to retrieve the list of project statuses(grouped by issue type) from a Jira server
   * @return {string} 'JSON' - Returns the valid statuses for a project. The statuses are grouped by issue type,
   *                  as each project has a set of valid issue types and each issue type has a set of valid statuses
   */
  @ApiOkResponse({
    description: 'List project statuses from a Jira server',
  })
  @Get('projects/statuses')
  async getJiraProjectIssueTypesWithStatus(
    @Query() queries: SearchProjectIssueTypesWithStatusQueryDTO,
  ): Promise<any> {
    return this.proxyApi.getJiraProjectIssueTypesWithStatus(queries.server, queries.projectIdOrKey);
  }

  /**
   * @GET (controller) api/screenDetails
   * @description Route to retrieve details of Screen from a Jira server
   * @return {string} 'JSON' - Returns the details of the screen
   */
  @ApiOkResponse({
    description: 'Get Issue Screen details',
  })
  @Get('screenDetails')
  async getJiraScreenDetails(
    @Query() queries: GetScreenDetailsDTO,
  ): Promise<any> {
    return this.proxyApi.getJiraIssueScreenDetails(queries.projectId, queries.issueTypeId);
  }

  /**
   * @GET (controller) api/projects/users
   * @description Route to retrieve the list of project categories from a Jira server
   * @return {string} 'JSON' - JSON with the list of Jira project categories
   */
  @ApiOkResponse({
    description: 'List users by query',
  })
  @Get('projects/users')
  async getJiraUsersByQuery(
    @Query() queries: SearchProjectUsersQueryDTO,
  ): Promise<any> {
    return this.proxyApi.getJiraUsersByQuery(queries.query, queries.startAt, queries.maxResults);
  }

  /**
   * @GET (controller) api/projects/versions
   * @description Returns all versions in a project
   * @return {string} 'JSON' - Returns the valid versions for a project.
   */
  @ApiOkResponse({
    description: 'List project versions',
  })
  @Get('projects/versions')
  async getJiraProjectVersions(
    @Query() queries: SearchProjectVersionsQueryDTO,
  ): Promise<FixVersion> {
    return this.proxyApi.getJiraProjectVersions(queries.projectIdOrKey);
  }

  /**
   * @GET (controller) api/spaces
   * @description Route to retrieve the Confluence spaces of a type
   * @return {string} 'JSON' - JSON with the list of Confluence spaces
   */
  @ApiOkResponse({
    description: 'List spaces from a Confluence server for the given type',
  })
  @Get('spaces/:type')
  async getSpaces(
    @Param() params: GetSpacesParamsDTO,
    @Query() queries: GetSpacesQueryDTO,
  ): Promise<any> {
    return this.proxyApi.getAllSpaces(
      params.type,
      queries.limit,
      queries.next,
    );
  }

  /**
   * @GET (controller) api/spaces/:type/meta
   * @description Route to retrieve meta of the Confluence spaces of a type
   * @return {string} 'JSON' - JSON with the meta of Confluence spaces
   */
  @ApiOkResponse({
    description: 'Meta of spaces from a Confluence server for the given type',
  })
  @Get('spaces/:type/meta')
  async getSpacesMeta(
    @Param() params: GetSpacesMetaParamsDTO,
  ): Promise<any> {
    return this.proxyApi.getSpacesMeta(
      params.type,
    );
  }

  /**
   * @GET (controller) api/spaces/spaceKey/pages/pageID
   * @description Route to retrieve page content data for rendering logic to be applied by the consumer ALPHA VERSION-NOT FOR PRODUCTION USE
   * @return {string} 'JSON' - JSON with the page content
   */
  @ApiOkResponse({ description: 'Get Konviw page API object' })
  @Version('0.1-alpha')
  @Get([
    '/spaces/:spaceKey/pages/:pageId/:pageSlug?',
    '/spaces/:spaceKey/blog/:year/:month/:day/:pageId/:pageSlug?',
  ])
  async getPageAPIResponse(
    @Param() params: PageParamsDTO,
    @Query() queries: PageQueryDTO,
  ) {
    this.logger.log(
      `Getting page through API ... /${params.spaceKey}/${params.pageId}`,
    );

    return this.proxyApi.getPage(params.spaceKey, params.pageId, queries.type);
  }
}
