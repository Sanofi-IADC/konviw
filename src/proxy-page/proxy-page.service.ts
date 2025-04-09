import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import getExcerptAndHeaderImage from '../proxy-api/steps/getExcerptAndHeaderImage';
import { ConfluenceService } from '../confluence/confluence.service';
import { JiraService } from '../jira/jira.service';
import { ContextService } from '../context/context.service';
import { Content } from '../confluence/confluence.interface';
import delUnnecessaryCode from './steps/delUnnecessaryCode';
import fixLinks from './steps/fixLinks';
import fixEmojis from './steps/fixEmojis';
import fixExpander from './steps/fixExpander';
import fixToc from './steps/fixToc';
import fixHtmlHead from './steps/fixHtmlHead';
import fixUserProfile from './steps/fixUserProfile';
import fixContentWidth from './steps/fixContentWidth';
import fixVideo from './steps/fixVideo';
import fixEmptyLineIncludePage from './steps/fixEmptyLineIncludePage';
import fixCode from './steps/fixCode';
import addCustomCss from './steps/addCustomCss';
import addScrollToTop from './steps/addScrollToTop';
import addHeaderTitle from './steps/addHeaderTitle';
import addTheme from './steps/addTheme';
import addZoom from './steps/addZoom';
import addHeaderBlog from './steps/addHeaderBlog';
import addCopyLinks from './steps/addCopyLinks';
import addReadingProgressBar from './steps/addReadingProgressBar';
import addJira from './steps/addJira';
import addWebStatsTracker from './steps/addWebStatsTracker';
import fixDrawioMacro from './steps/fixDrawio';
import fixChartMacro from './steps/fixChart';
import fixRoadmap from './steps/fixRoadmap';
import fixFrameAllowFullscreen from './steps/fixFrameAllowFullscreen';
import fixImageSize from './steps/fixImageSize';
import fixColGroupWidth from './steps/fixColGroupWidth';
import addLibrariesCSS from './steps/addLibrariesCSS';
import addLibrariesJS from './steps/addLibrariesJS';
import addSlidesCSS from './steps/addSlidesCSS';
import addSlidesJS from './steps/addSlidesJS';
import addUnsupportedMacroIndicator from './steps/addUnsupportedMacroIndicator';
import fixSVG from './steps/fixSVG';
import fixTableBackground from './steps/fixTableBackground';
import addSlideTypeByStrategy from './strategySteps/addSlideTypeByStrategy';
import addSlideContextByStrategy from './strategySteps/addSlideContextByStrategy';
import fixCaptionImage from './steps/fixCaptionImage';
import fixConfluenceSpace from './steps/fixConfluenceSpace';
import addTableResponsive from './steps/addTableResponsive';
import fixTableSize from './steps/fixTableSize';
import addAuthorVersion from './steps/addAuthorVersion';
import addMessageLastSlide from './steps/addMessageLastSlide';
import addPDF from './steps/addPDF';
import fixProfilePicture from './steps/fixProfilePicture';
import fixEmbeddedFile from './steps/fixEmbeddedFile';
import fixRecentlyUpdated from './steps/fixRecentlyUpdated';

@Injectable()
export class ProxyPageService {
  private readonly logger = new Logger(ProxyPageService.name);

  constructor(
    private config: ConfigService,
    private context: ContextService,
    private confluence: ConfluenceService,
    private jira: JiraService,
    private readonly http: HttpService,
  ) {}

  /**
   * @function renderPage Service
   * @description Render a Confluence page as read-only konviw document
   * @return Promise {string}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   * @param version {string} '9' - the version of the page to render
   * @param theme {string} 'dark' - light or dark theme used by the page
   * @param type {string} 'blog' - type of the page
   * @param style {string} 'konviw' - style to render the page
   * @param view {string} 'fullpage' - disable scroll to top, zoom effect in images, reading progress bar and floating toc menu
   * @param status {string} 'current' - use 'current' or nothing for published pages and 'draft' for pages in DRAFT not yet published
   */
  async renderPage(
    spaceKey: string,
    pageId: string,
    version: string,
    theme: string,
    type: string,
    style: string,
    view: string,
    status: string,
  ): Promise<string> {
    const content: Content = await this.confluence.getPage(
      spaceKey,
      pageId,
      version,
      status,
    );
    this.context.initPageContext(
      'v2',
      spaceKey,
      pageId,
      theme,
      type,
      style,
      content,
      true, // loadAsDocument
      view,
    );
    const contextType = this.context.getType();
    const addJiraPromise = addJira(this.config, this.jira)(this.context);
    await getExcerptAndHeaderImage(this.config, this.confluence)(this.context);
    fixHtmlHead(this.config)(this.context);
    fixContentWidth()(this.context);
    fixUserProfile()(this.context);
    fixProfilePicture()(this.context);
    await fixConfluenceSpace(this.config, this.confluence)(this.context);
    await fixLinks(this.config, this.http, this.jira)(this.context);
    if (view !== 'iframe-resizer') {
      fixToc()(this.context);
    }
    await fixEmojis(this.config, this.confluence)(this.context);
    fixDrawioMacro(this.config)(this.context);
    fixChartMacro(this.config)(this.context);
    fixExpander()(this.context);
    fixVideo()(this.context);
    // fixEmptyLineIncludePage()(this.context);
    fixRoadmap(this.config)(this.context);
    fixCode()(this.context);
    fixFrameAllowFullscreen()(this.context);
    fixCaptionImage()(this.context);
    fixImageSize()(this.context);
    fixColGroupWidth()(this.context);
    if (contextType.includes('blog')) {
      await addHeaderBlog()(this.context);
    } else if (!contextType.includes('notitle')) {
      await addHeaderTitle(this.confluence)(this.context);
    }
    fixSVG(this.config)(this.context);
    fixEmbeddedFile()(this.context);
    fixTableBackground()(this.context);
    fixTableSize()(this.context);
    fixRecentlyUpdated()(this.context);
    addTableResponsive()(this.context);
    addAuthorVersion()(this.context);
    delUnnecessaryCode()(this.context);
    addCustomCss(this.config, style)(this.context);
    addLibrariesCSS()(this.context);
    addZoom()(this.context);
    addTheme()(this.context);
    if (view !== 'iframe-resizer') {
      addScrollToTop()(this.context);
      addReadingProgressBar()(this.context);
    }
    addCopyLinks()(this.context);
    addWebStatsTracker(this.config)(this.context);
    await addJiraPromise;
    addLibrariesJS()(this.context);
    addUnsupportedMacroIndicator()(this.context);
    await addPDF(this.confluence)(this.context);
    this.context.Close();
    return this.context.getHtmlBody();
  }

  /**
   * @function renderSlides Service
   * @description Render a Confluence page as konviw slide deck
   * @return Promise {string}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   * @param version {string} '9' - the version of the page to render
   * @param style {string} 'konviw' - style to render the page
   * @param theme {string} 'light' - the theme used of the page
   * @param status {string} 'current' - use 'current' or nothing for published pages and 'draft' for pages in DRAFT not yet published
   */
  async renderSlides(
    spaceKey: string,
    pageId: string,
    version: string,
    style: string,
    status: string,
  ): Promise<string> {
    const content: Content = await this.confluence.getPage(spaceKey, pageId, version, status);
    addSlideContextByStrategy(
      this.context,
      spaceKey,
      pageId,
      style,
      content,
    );
    const addJiraPromise = addJira(this.config, this.jira)(this.context);
    addSlidesCSS(this.config)(this.context);
    fixHtmlHead(this.config)(this.context);
    fixUserProfile()(this.context);
    fixProfilePicture()(this.context);
    fixEmbeddedFile()(this.context);
    await fixConfluenceSpace(this.config, this.confluence)(this.context);
    await fixLinks(this.config, this.http, this.jira)(this.context);
    fixToc()(this.context);
    await fixEmojis(this.config, this.confluence)(this.context);
    fixDrawioMacro(this.config)(this.context);
    fixChartMacro(this.config)(this.context);
    fixExpander()(this.context);
    fixVideo()(this.context);
    fixEmptyLineIncludePage()(this.context);
    fixRoadmap(this.config)(this.context);
    fixCaptionImage()(this.context);
    fixImageSize()(this.context);
    fixFrameAllowFullscreen()(this.context);
    fixSVG(this.config)(this.context);
    fixTableBackground()(this.context);
    // addTableResponsive()(this.context);
    delUnnecessaryCode()(this.context);
    await addJiraPromise;
    addSlideTypeByStrategy(this.config)(this.context);
    addSlidesJS(this.config)(this.context);
    addMessageLastSlide()(this.context);
    addWebStatsTracker(this.config)(this.context);
    await addPDF(this.confluence)(this.context);
    this.context.Close();
    return this.context.getHtmlBody();
  }

  /**
   * @function getMediaCdnUrl Service
   * @return Promise string
   * @param uri {string} 'iadc' - URL of the media file to return
   */
  getMediaCdnUrl(uri: string): Promise<string> {
    return this.confluence.getRedirectUrlForMedia(uri);
  }
}
