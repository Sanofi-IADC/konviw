import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProxyApiService } from './proxy-api.service';
import { PostsParamsDTO, SearchQueryDTO } from './proxy-api.validation.dto';

@Controller('api')
export class ProxyApiController {
  constructor(private readonly proxyApi: ProxyApiService) {}

  /**
   * @GET (controller) api/getAllPosts/:spaceKey
   * @description Route to retrieve the standard media files like images and videos (usually attachments)
   * @return {string} 'url' - URL of the media to display
   */
  @Get('getAllPosts/:spaceKey')
  async getAllPosts(@Param() params: PostsParamsDTO): Promise<any> {
    const data = await this.proxyApi.getAllPosts(params.spaceKey);
    return data;
  }

  /**
   * @GET (controller) api/search
   * @description Route to retrieve the standard media files like images and videos (usually attachments)
   * @return {string} 'url' - URL of the media to display
   */
  @Get('search')
  async getSearchResults(@Query() queries: SearchQueryDTO): Promise<any> {
    const data = await this.proxyApi.getSearchResults(
      queries.spaceKey,
      queries.query,
    );
    return data;
  }
}
