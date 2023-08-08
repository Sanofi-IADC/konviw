import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { performance, PerformanceObserver } from 'perf_hooks';
import { ConfigService } from '@nestjs/config';
import { ConfluenceRestAPIv2PageContent, Content, Label } from '../confluence/confluence.interface';
import { Version } from './context.interface';

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);

  // The Confluence space key
  private spaceKey = '';

  // The unique page ID
  private pageId = '';

  // Document type could be 'page' or 'blogpost'
  private type = '';

  // Theme between 'light' (default) and 'dark'
  private theme = '';

  private style = '';

  private slideTransition = '';

  private view = '';

  private cheerioBody = cheerio.load('html');

  private title = '';

  private createdVersion: Version;

  private lastVersion: Version;

  private author = '';

  private email = '';

  private avatar = '';

  private excerpt = '';

  private imgblog = '';

  private when = '';

  private friendlyWhen = '';

  private searchResults = '';

  private labels: string[] = [];

  private fullWidth = false;

  private headerImage = '';

  private headerEmoji = '';

  private observer: PerformanceObserver;

  constructor(private config: ConfigService) {}

  initPageContext(
    spaceKey: string,
    pageId: string,
    theme: string,
    type?: string,
    style?: string,
    data?: ConfluenceRestAPIv2PageContent | Content,
    loadAsDocument = true, // eslint-disable-line default-param-last
    view?: string,
  ) {
    this.spaceKey = spaceKey;
    this.pageId = pageId;
    this.theme = theme;
    this.type = type;
    this.style = style;
    const logger = new Logger(ContextService.name);

    // Activate the observer in development
    if (this.config.get('env').toString() === 'development') {
      this.observer = new PerformanceObserver((list) => {
        const entry = list.getEntries()[0];
        logger.log(`Time for [${entry.name}] = ${entry.duration}ms`);
      });
      this.observer.observe({ entryTypes: ['measure'], buffered: false });
    }

    if (view) {
      this.setView(view);
    }
    if (data) {
      const baseHost = this.config.get('web.baseHost');
      const basePath = this.config.get('web.basePath');

      this.setTitle(data.pageContent.title);
      this.spaceKey = data.spaceContent.key;
      this.setHtmlBody(data.pageContent.body.view.value, loadAsDocument);
      this.setAuthor(data.authorContent.publicName);
      this.setEmail(data.authorContent.email);
      this.setAvatar(
        `${baseHost}${basePath}/${data.authorContent.profilePicture.path.replace(
          /^\/wiki/,
          'wiki',
        )}`,
      );
      this.setWhen(data.pageContent.createdAt);
      this.setLabels(data.labelsContent.results);

      const createdBy: Version = {
        versionNumber: 1,
        when: data.pageContent.createdAt,
        friendlyWhen: timeFromNow(data.pageContent.createdAt),
        modificationBy: {
          displayName: data.authorContent.publicName,
          email: data.authorContent.email,
          profilePicture: this.getAvatar(),
        },
      };
      this.setCreatedVersion(createdBy);

      const modifiedBy: Version = {
        versionNumber: data.pageContent.version.number,
        when: data.pageContent.version.createdAt,
        friendlyWhen: timeFromNow(data.pageContent.version.createdAt),
        modificationBy: {
          displayName: data.versionAuthorContent.publicName,
          email: data.versionAuthorContent.email,
          profilePicture: `${baseHost}${basePath}/${data.versionAuthorContent.profilePicture?.path.replace(
            /^\/wiki/,
            'wiki',
          )}`,
        },
      };
      this.setLastVersion(modifiedBy);

      if (data.propertiesContent['content-appearance-published']?.value === 'full-width') {
        this.setFullWidth(true);
      } else {
        this.setFullWidth(false);
      }

      // retrieve the header image published and set in context
      if (data.propertiesContent['cover-picture-id-published']) {
        this.setHeaderImage(
          JSON.parse(
            data.propertiesContent['cover-picture-id-published'].value,
          ).id,
        );
        logger.log(
          `GET cover-picture-id-published to set context 'headerImage' to ${this.getHeaderImage()}`,
        );
      } else {
        this.setHeaderImage('');
      }

      // retrieve the header emoji published and set in context
      if (data.propertiesContent['emoji-title-published']) {
        this.setHeaderEmoji(
          data.propertiesContent['emoji-title-published'].value,
        );
        logger.log(
          `GET emoji-title-published to set context 'headerEmoji' to ${this.getHeaderEmoji()}`,
        );
      } else {
        this.setHeaderEmoji('');
      }
    }
  }

  Close() {
    // Disconnect the PerformanceObserver only in development
    if (this.config.get('env').toString() === 'development') {
      this.observer.disconnect();
    }
  }

  setPerfMark(mark: string): void {
    // Activate PerformanceObserver only in development
    if (this.config.get('env').toString() === 'development') {
      performance.mark(`${mark}-init`);
    }
  }

  getPerfMeasure(mark: string): void {
    // Get PerformanceObserver metrics only in development
    if (this.config.get('env').toString() === 'development') {
      performance.mark(`${mark}-end`);
      performance.measure(`${mark}`, `${mark}-init`, `${mark}-end`);
    }
  }

  getPageId(): string {
    return this.pageId;
  }

  getSpaceKey(): string {
    return this.spaceKey;
  }

  getType(): string[] {
    return this.type?.split(',') ?? [];
  }

  setType(type: string): void {
    this.type = type;
  }

  getTitle(): string {
    return this.title;
  }

  setTitle(title: string): void {
    this.title = title;
  }

  getCreatedVersion(): Version {
    return this.createdVersion;
  }

  setCreatedVersion(version: Version): void {
    this.createdVersion = version;
  }

  getLastVersion(): Version {
    return this.lastVersion;
  }

  setLastVersion(version: Version): void {
    this.lastVersion = version;
  }

  getCheerioBody(): cheerio.CheerioAPI {
    return this.cheerioBody;
  }

  getHtmlBody(): string {
    return this.getCheerioBody().html();
  }

  getHtmlInnerBody(): string {
    const $ = this.cheerioBody;
    return $('Body').unwrap().html();
  }

  getHtmlHeader(): string {
    const $ = this.cheerioBody;
    const header = $('Head').unwrap();
    header.find('title').remove();
    return header.html();
  }

  getTextBody(): string {
    const $ = this.cheerioBody;
    return $('<div>').html($.html()).text().trim();
  }

  setHtmlBody(body: string, loadAsDocument = true): void {
    const $ = cheerio.load(body);
    // we wrap the body in a div with ID Content
    this.cheerioBody = cheerio.load(
      $('html').wrapInner('<div id="Content">').html(),
      null,
      loadAsDocument,
    );
  }

  getResults(): string {
    return this.searchResults;
  }

  setResults(results: string): void {
    this.searchResults = results;
  }

  isFullWidth(): boolean {
    return this.fullWidth;
  }

  setFullWidth(fullWidth: boolean): void {
    this.fullWidth = fullWidth;
  }

  getView(): string {
    return this.view;
  }

  setView(view: string): void {
    this.view = view;
  }

  getTheme(): string {
    return this.theme;
  }

  getStyle(): string {
    return this.style;
  }

  getSlideTransition(): string {
    return this.slideTransition;
  }

  setSlideTransition(transition: string): void {
    this.slideTransition = transition;
  }

  getAuthor(): string {
    return this.author;
  }

  setAuthor(author: string): void {
    this.author = author;
  }

  getEmail(): string {
    return this.email;
  }

  setEmail(email: string): void {
    this.email = email;
  }

  getWhen(): string {
    return this.when;
  }

  setWhen(when: string): void {
    this.when = when;
    this.friendlyWhen = timeFromNow(when);
  }

  getFriendlyWhen(): string {
    return this.friendlyWhen;
  }

  getAvatar(): string {
    return this.avatar;
  }

  setAvatar(avatar: string): void {
    this.avatar = avatar;
  }

  getReadTime(): number {
    const words = this.getTextBody().split(' ').length;
    const wordsPerMinute = 200;
    return Math.ceil(words / wordsPerMinute);
  }

  getExcerpt(): string {
    return this.excerpt;
  }

  setExcerpt(excerpt: any): void {
    this.excerpt = String(excerpt);
  }

  getImgBlog(): string {
    return this.imgblog;
  }

  setImgBlog(imgblog: any): void {
    this.imgblog = String(imgblog);
  }

  getLabels(): string[] {
    return this.labels;
  }

  setLabels(labels: Label[]): void {
    this.labels = labels.map((label: Label) => label.name);
  }

  setHeaderImage(image: string): void {
    this.headerImage = image;
  }

  getHeaderImage(): string {
    return this.headerImage;
  }

  setHeaderEmoji(code: string): void {
    this.headerEmoji = code ? `&#x${code};` : '';
  }

  getHeaderEmoji(): string {
    return this.headerEmoji;
  }
}

/*
 * Get the amount of time from now for a date
 * (c) 2019 Chris Ferdinandi, MIT License
 * https://gomakethings.com/a-vanilla-js-alternative-to-the-moment.js-timefromnow-method/
 * @param  {String} The date to get the time from now for
 * @return {String} The time from now data
 */
function timeFromNow(TimeToConvert: string): string {
  // Get timestamps
  const unixTime = new Date(TimeToConvert).getTime();
  if (!unixTime) return '';
  const now = new Date().getTime();

  // Calculate difference
  let difference = unixTime / 1000 - now / 1000;

  // Convert difference to absolute
  difference = Math.abs(difference);
  let unitOfTime = '';
  let time = 0;

  // Calculate time unit
  if (difference / (60 * 60 * 24 * 365) > 1) {
    unitOfTime = 'years';
    time = Math.floor(difference / (60 * 60 * 24 * 365));
  } else if (difference / (60 * 60 * 24 * 45) > 1) {
    unitOfTime = 'months';
    time = Math.floor(difference / (60 * 60 * 24 * 45));
  } else if (difference / (60 * 60 * 24) > 1) {
    unitOfTime = 'days';
    time = Math.floor(difference / (60 * 60 * 24));
  } else if (difference / (60 * 60) > 1) {
    unitOfTime = 'hours';
    time = Math.floor(difference / (60 * 60));
  } else {
    unitOfTime = 'seconds';
    time = Math.floor(difference);
  }

  // Return time from now data
  return `${time} ${unitOfTime} ago`;
}
