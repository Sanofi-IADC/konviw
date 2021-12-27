import { Injectable, Logger } from '@nestjs/common';
import { ConfluenceService } from '../confluence/confluence.service';
import { JiraService } from '../jira/jira.service';
import { ContextService } from '../context/context.service';
import { ConfigService } from '@nestjs/config';
import delUnnecessaryCode from './steps/delUnnecessaryCode';
import fixLinks from './steps/fixLinks';
import fixEmojis from './steps/fixEmojis';
import fixExpander from './steps/fixExpander';
import fixToc from './steps/fixToc';
import fixHtmlHead from './steps/fixHtmlHead';
import fixUserProfile from './steps/fixUserProfile';
import fixContentWidth from './steps/fixContentWidth';
import fixVideo from './steps/fixVideo';
import fixTableColGroup from './steps/fixTableColGroup';
import fixEmptyLineIncludePage from './steps/fixEmptyLineIncludePage';
import addCustomCss from './steps/addCustomCss';
import addZooming from './steps/addZooming';
import addHighlightjs from './steps/addHighlightjs';
import addScrollToTop from './steps/addScrollToTop';
import addHeaderTitle from './steps/addHeaderTitle';
import addTheme from './steps/addTheme';
import addNoZoom from './steps/addNoZoom';
import addHeaderBlog from './steps/addHeaderBlog';
import addSlides from './steps/addSlides';
import addMessageBus from './steps/addMessageBus';
import addCopyLinks from './steps/addCopyLinks';
import addReadingProgressBar from './steps/addReadingProgressBar';
import addJira from './steps/addJira';
import addWebStatsTracker from './steps/addWebStatsTracker';
import fixDrawioMacro from './steps/fixDrawio';
import fixChartMacro from './steps/fixChart';
import fixRoadmap from './steps/fixRoadmap';
import fixFrameAllowFullscreen from './steps/fixFrameAllowFullscreen';

@Injectable()
export class ProxyPageService {
  private readonly logger = new Logger(ProxyPageService.name);
  constructor(
    private config: ConfigService,
    private context: ContextService,
    private confluence: ConfluenceService,
    private jira: JiraService,
  ) {}

  private initContext(
    spaceKey: string,
    pageId: string,
    theme: string,
    style: string,
    results: any,
  ) {
    this.context.Init(spaceKey, pageId, theme, style);
    this.context.setTitle(results.title);
    this.context.setHtmlBody(results.body.view.value);
    this.context.setAuthor(results.history.createdBy.displayName);
    this.context.setEmail(results.history.createdBy.email);
    this.context.setAvatar(results.history.createdBy.profilePicture.path);
    this.context.setWhen(results.history.createdDate);
    if (
      results.metadata.properties['content-appearance-published'] &&
      results.metadata.properties['content-appearance-published'].value ===
        'full-width'
    ) {
      this.context.setFullWidth(true);
    } else {
      this.context.setFullWidth(false);
    }
  }

  /**
   * Function renderPage Service
   *
   * @return Promise {string}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   * @param theme {string} 'dark' - light or dark theme used by the page
   * @param type {string} 'blog' - type of the page
   * @param style {string} 'iadc' - theme to style the page
   */
  async renderPage(
    spaceKey: string,
    pageId: string,
    theme: string,
    type: string,
    style: string,
    nozoom: string,
  ): Promise<string> {
    const { data } = await this.confluence.getPage(spaceKey, pageId);
    this.initContext(spaceKey, pageId, theme, style, data);
    const addJiraPromise = addJira(this.config, this.jira)(this.context);
    fixHtmlHead(this.config)(this.context);
    fixContentWidth()(this.context);
    fixLinks(this.config)(this.context);
    fixToc()(this.context);
    fixEmojis(this.config)(this.context);
    fixDrawioMacro(this.config)(this.context);
    fixChartMacro(this.config)(this.context);
    fixExpander()(this.context);
    fixUserProfile()(this.context);
    fixVideo()(this.context);
    fixTableColGroup()(this.context);
    fixEmptyLineIncludePage()(this.context);
    fixRoadmap(this.config)(this.context);
    fixFrameAllowFullscreen()(this.context);
    if (type === 'blog') {
      addHeaderBlog()(this.context);
    } else if (type !== 'notitle') {
      addHeaderTitle()(this.context);
    }
    delUnnecessaryCode()(this.context);
    addCustomCss(this.config, style)(this.context);
    addMessageBus(this.config)(this.context);
    if (nozoom == undefined) {
      addZooming(this.config)(this.context);
      addNoZoom()(this.context);
    }
    addHighlightjs(this.config)(this.context);
    addTheme()(this.context);
    addScrollToTop()(this.context);
    addReadingProgressBar()(this.context);
    addCopyLinks()(this.context);
    addWebStatsTracker(this.config)(this.context);
    await addJiraPromise;
    this.context.Close();
    return this.context.getHtmlBody();
  }

  /**
   * @function renderSlides Service
   * @return Promise {string}
   * @param spaceKey {string} 'iadc' - space key where the page belongs
   * @param pageId {string} '639243960' - id of the page to retrieve
   * @param theme {string} '#FFFFFF' - the theme used of the page
   */
  async renderSlides(
    spaceKey: string,
    pageId: string,
    style: string,
    transition: string,
  ): Promise<string> {
    const { data } = await this.confluence.getPage(spaceKey, pageId);
    this.initContext(spaceKey, pageId, 'light', style, data);
    const addJiraPromise = addJira(this.config, this.jira)(this.context);
    fixHtmlHead(this.config)(this.context);
    fixLinks(this.config)(this.context);
    fixEmojis(this.config)(this.context);
    fixDrawioMacro(this.config)(this.context);
    fixChartMacro(this.config)(this.context);
    fixExpander()(this.context);
    fixUserProfile()(this.context);
    fixVideo()(this.context);
    fixTableColGroup()(this.context);
    fixEmptyLineIncludePage()(this.context);
    fixRoadmap(this.config)(this.context);
    fixFrameAllowFullscreen()(this.context);
    delUnnecessaryCode()(this.context);
    await addJiraPromise;
    addSlides(this.config, transition)(this.context);
    addWebStatsTracker(this.config)(this.context);
    this.context.Close();
    return this.context.getHtmlBody();
  }

  /**
   * getMediaCdnUrl Service
   * @return Promise string
   * @param uri {string} 'iadc' - URL of the media file to return
   */
  getMediaCdnUrl(uri: string): Promise<string> {
    return this.confluence.getRedirectUrlForMedia(uri);
  }
}
