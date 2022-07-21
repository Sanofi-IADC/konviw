import {
  Controller,
  Get,
  Param,
  Res,
  Req,
  Logger,
  Query,
} from '@nestjs/common';
import { ProxyPageService } from './proxy-page.service';
import { Response, Request } from 'express';
import {
  PageParamsDTO,
  PageQueryDTO,
  SlidesQueryDTO,
} from './proxy-page.validation.dto';
import { ApiOkResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
@ApiTags('proxy-page')
@Controller('wiki')
export class ProxyPageController {
  private readonly logger = new Logger(ProxyPageController.name);

  constructor(private readonly proxyPage: ProxyPageService) {}

  /**
   * @description Route to get a read-only fully rendered Confluence page or blog post
   *
   * @GET (controller) /spaces/:spaceKey/pages/:pageId/:pageSlug?
   * @GET (controller) /spaces/:spaceKey/blog/:year/:month/:day/:pageId/:pageSlug?
   * @return {string} 'html' - full html of the rendered Confluence page
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param year {string} [optional] '2021' - year of publication of the blog post
   * @param month {string} [optional] '04' - month of publication of the blog post
   * @param day {string} [optional] '12' - day of publication of the blog post
   * @param pageId {string} '639243960' - id of the page to retrieve
   * @query theme {string} 'dark' - switch between light and dark themes
   * @query type {string} 'blog' - 'blog' to display a post header or 'notitle' to remove the title of the page
   * @query style {string} 'konviw' - style to render the page
   * @query nozoom {string} '' - disable zoom effect in images
   * @query view {string} '' - disable scroll to top, zoom effect in images, reading progress bar and floating toc menu
   */

  @ApiOperation({
    summary: 'Render a Page',
    description:
      'Render the page last version or the one defined (optional) in the route',
  })
  @ApiOkResponse({ description: 'Full html of the rendered Confluence page' })
  @Get([
    '/spaces/:spaceKey/pages/:pageId/:pageSlug?',
    '/spaces/:spaceKey/pages/:pageId/versions/:pageVersion/:pageSlug?',
    '/spaces/:spaceKey/blog/:year/:month/:day/:pageId/:pageSlug?',
  ])
  async getPage(
    @Param() params: PageParamsDTO,
    @Query() queries: PageQueryDTO,
  ) {
    this.logger.log(
      `Rendering page.. /${params.spaceKey}/${params.pageId}/${params.pageVersion}`,
    );
    return this.proxyPage.renderPage(
      params.spaceKey,
      params.pageId,
      params.pageVersion,
      queries.theme,
      queries.type,
      queries.style,
      queries.view,
    );
  }

  /**
   * Route to get a full reveal.js slides from a single Confluence page
   *
   * @GET (controller) /slides/:spaceKey/:pageId/:pageSlug?
   * @return {string} 'html' - full html of the rendered page as reveal.js slides
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   * @query style {string} 'konviw' - select the theme to use for your slide deck
   * @query transition {string} 'slide' - transition animation for the slide deck
   */
  @ApiOperation({
    summary: 'Render a Slides',
    description:
      'Render the page in slide show format if slide content is available',
  })
  @ApiOkResponse({
    description: 'Full html of the rendered page as reveal.js slides',
  })
  @Get('/slides/:spaceKey/:pageId/:pageSlug?')
  async getSlides(
    @Param() params: PageParamsDTO,
    @Query() queries: SlidesQueryDTO,
  ) {
    this.logger.log(
      `Rendering Slides for ... /${params.spaceKey}/${params.pageId} with style ${queries.style}`,
    );
    return this.proxyPage.renderSlides(
      params.spaceKey,
      params.pageId,
      queries.style,
      queries.transition,
    );
  }

  /**
   * Route to retrieve the standard media files like images, videos or user profile avatar
   *
   * @GET (controller) /download/* or /aa-avatar/*
   * @return {string} 'url' - URL of the media to display
   */
  @ApiOperation({
    summary: 'Redirect to media',
    description: 'Retrieve  media content defined in Confluence pages',
  })
  @Get(['/download/*', '/aa-avatar/*'])
  async getMedia(@Req() req: Request, @Res() res: Response) {
    const reqUrl = req.url.replace(/\/cpv\/wiki\//, '');
    const mediaCdnUrl = await this.proxyPage.getMediaCdnUrl(reqUrl);
    res.redirect(mediaCdnUrl);
  }
}
