import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProxyApiService } from './proxy-api.service';
import {
  PostsParamsDTO,
  SearchQueryDTO,
  SearchProjectsQueryDTO,
  SearchProjectCategoriesQueryDTO,
  GetSpacesParamsDTO,
  GetSpacesQueryDTO,
} from './proxy-api.validation.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { KonviwResults } from './proxy-api.interface';
@ApiTags('proxy-api')
@Controller('api')
export class ProxyApiController {
  constructor(private readonly proxyApi: ProxyApiService) {}

  /**
   * @GET (controller) api/getAllPosts/:spaceKey
   * @description Route to retrieve the list of blog posts in the defined spaceKey
   * @return {string} 'JSON' - JSON with Blog Posts content and metadata
   */
  @ApiOkResponse({ description: 'All blog posts from a given space key' })
  @Get('getAllPosts/:spaceKey')
  async getAllPosts(@Param() params: PostsParamsDTO): Promise<KonviwResults> {
    return await this.proxyApi.getSearchResults(
      params.spaceKey,
      '',
      'blogpost',
      999,
      '',
    );
  }

  /**
   * @GET (controller) api/search
   * @description Route to retrieve the list of Confluence pages matching the passed criteria
   * @return {string} 'JSON' - JSON with searched pages and metadata
   */
  @ApiOkResponse({
    description: 'All pages that matches the given search string',
  })
  @Get('search')
  async getSearchResults(
    @Query() queries: SearchQueryDTO,
  ): Promise<KonviwResults> {
    return this.proxyApi.getSearchResults(
      queries.spaceKey,
      queries.query,
      queries.type,
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
      queries.startAt,
      queries.maxResults,
      queries.getFields,
    );
  }
}
