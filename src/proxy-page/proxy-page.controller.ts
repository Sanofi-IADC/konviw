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
import { PageParamsDTO, PageQueryDTO } from './proxy-page.validation.dto';

@Controller('wiki')
export class ProxyPageController {
  private readonly logger = new Logger(ProxyPageController.name);

  constructor(private readonly proxyPage: ProxyPageService) {}

  /**
   * @GET (controller) /spaces/:spaceKey/pages/:pageId/:pageSlug?
   * @GET (controller) /spaces/:spaceKey/blog/:year/:month/:day/:pageId/:pageSlug?
   * @description Route to get a read-only fully rendered Confluence page or blog post
   * @return {string} 'html' - full html of the rendered Confluence page
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param year {string} [optional] '2021' - year of publication of the blog post
   * @param month {string} [optional] '04' - month of publication of the blog post
   * @param day {string} [optional] '12' - day of publication of the blog post
   * @param pageId {string} '639243960' - id of the page to retrieve
   * @query theme {string} 'dark' - switch between light and dark themes
   * @query type {string} 'blog' - 'blog' to display a post header or 'notitle' to remove the title of the page
   */
  @Get([
    '/spaces/:spaceKey/pages/:pageId/:pageSlug?',
    '/spaces/:spaceKey/blog/:year/:month/:day/:pageId/:pageSlug?',
  ])
  async getPage(
    @Param() params: PageParamsDTO,
    @Query() queries: PageQueryDTO,
  ) {
    this.logger.verbose(`Rendering... /${params.spaceKey}/${params.pageId}`);
    return this.proxyPage.renderPage(
      params.spaceKey,
      params.pageId,
      queries.theme,
      queries.type,
      queries.style,
    );
  }

  /**
   * @GET (controller) /slides/:spaceKey/:pageId/:pageSlug?
   * @description Route to get a full reveal.js slides from a single Confluence page
   * @return {string} 'html' - full html of the rendered page as reveal.js slides
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   * @query theme {string} 'iadc' - select the theme to use for your slide deck
   */
  @Get('/slides/:spaceKey/:pageId/:pageSlug?')
  async getSlides(
    @Param() params: PageParamsDTO,
    @Query() queries: PageQueryDTO,
  ) {
    this.logger.verbose(
      `Rendering Slides for ... /${params.spaceKey}/${params.pageId} with theme ${queries.theme}`,
    );
    return this.proxyPage.renderSlides(
      params.spaceKey,
      params.pageId,
      queries.theme,
    );
  }

  /**
   * @GET (controller) /download/* or /aa-avatar/*
   * @description Route to retrieve the standard media files like images, videos or user profile avatar
   * @return {string} 'url' - URL of the media to display
   */
  @Get(['/download/*', '/aa-avatar/*'])
  async getMedia(@Req() req: Request, @Res() res: Response) {
    const reqUrl = req.url.replace(/\/cpv\/wiki/, '');
    const mediaCdnUrl = await this.proxyPage.getMediaCdnUrl(reqUrl);
    res.redirect(mediaCdnUrl);
  }
}
