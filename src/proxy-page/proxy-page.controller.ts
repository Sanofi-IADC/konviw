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
   * @description Route to get a read-only fully rendered Confluence page
   * @return {string} 'html' - full html of the rendered Confluence page
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   * @query theme {string} 'dark' - switch between light and dark themes
   * @query type {string} 'blog' - 'blog' to display a post header or 'notitle' to remove the title of the page
   */
  @Get('/spaces/:spaceKey/pages/:pageId/:pageSlug?')
  async getPage(
    @Param() params: PageParamsDTO,
    @Query() queries: PageQueryDTO,
  ) {
    this.logger.verbose(`Rendering... /${params.spaceKey}/${params.pageId}`);
    const page = await this.proxyPage.renderPage(
      params.spaceKey,
      params.pageId,
      queries.theme,
      queries.type,
    );
    return page;
  }

  /**
   * @GET (controller) /slides/:spaceKey/:pageId/:pageSlug?
   * @description Route to get a full reveal.js slides from a single Confluence page
   * @return {string} 'html' - full html of the rendered page as reveal.js slides
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   */
  @Get('/slides/:spaceKey/:pageId/:pageSlug?')
  async getSlides(@Param() params: PageParamsDTO, @Res() res: Response) {
    this.logger.verbose(
      `Rendering Slides for ... /${params.spaceKey}/${params.pageId}`,
    );
    const page = await this.proxyPage.renderSlides(
      params.spaceKey,
      params.pageId,
    );
    return page;
  }

  /**
   * @GET (controller) /download/*
   * @description Route to retrieve the standard media files like images and videos (usually attachments)
   * @return {string} 'url' - URL of the media to display
   */
  @Get('/download/*')
  async download(@Req() req: Request, @Res() res: Response) {
    const reqUrl = req.url.replace(/\/cpv\/wiki/, '');
    const mediaCdnUrl = await this.proxyPage.getMediaCdnUrl(reqUrl);
    res.redirect(mediaCdnUrl);
  }

  /**
   * @GET (controller) /aa-avatar/*
   * @description Route to retrieve the avatar image asociated with a Confluence user profile
   * @return {string} 'url' - URL of the media to display
   */
  @Get('/aa-avatar/*')
  async avatar(@Req() req: Request, @Res() res: Response) {
    const reqUrl = req.url.replace(/\/cpv\/wiki/, '');
    const mediaCdnUrl = await this.proxyPage.getMediaCdnUrl(reqUrl);
    res.redirect(mediaCdnUrl);
  }
}
