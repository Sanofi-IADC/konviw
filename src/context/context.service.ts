import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { performance, PerformanceObserver } from 'perf_hooks';
import { ConfigService } from '@nestjs/config';
import { Content, Label } from '../confluence/confluence.interface';
import {
  ApiVersion, Version, EmojiType, IconType,
} from './context.interface';
import {
  contentAppearancePublishedHelper,
  coverPictureIdPublishedHelper,
  emojiTitlePublishedHelper,
  setAuthorHelper,
  setAvatarHelper,
  setCreatedVersionHelper,
  setEmailHelper,
  setBodyStorageHelper,
  setLabelsHelper,
  setLastVersionHelper,
  setSpaceKeyHelper,
  setTitleHelper,
  setWhenHelper,
  timeFromNow,
  setHtmlBodyHelper,
} from './context.helpers';

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

  private apiVersion: ApiVersion;

  private cheerioBody = cheerio.load('html');

  private bodyStorage = '';

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

  private headerEmoji : EmojiType;

  private observer: PerformanceObserver;

  constructor(private config: ConfigService) {}

  initPageContext(
    apiVersion: ApiVersion,
    spaceKey: string,
    pageId: string,
    theme: string,
    type?: string,
    style?: string,
    data?: Content,
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

    this.setApiVersion(apiVersion);

    if (view) {
      this.setView(view);
    }
    if (data) {
      const baseHost = this.config.get('web.baseHost');
      const basePath = this.config.get('web.basePath');

      this.setTitle(setTitleHelper(data, apiVersion));
      this.spaceKey = setSpaceKeyHelper(data, apiVersion);
      this.setHtmlBody(setHtmlBodyHelper(data, apiVersion), loadAsDocument);
      this.setBodyStorage(setBodyStorageHelper(data, apiVersion));
      this.setAuthor(setAuthorHelper(data, apiVersion));
      this.setEmail(setEmailHelper(data, apiVersion));
      this.setAvatar(setAvatarHelper(baseHost, basePath, data, apiVersion));
      this.setWhen(setWhenHelper(data, apiVersion));
      this.setLabels(setLabelsHelper(data, apiVersion));
      this.setCreatedVersion(setCreatedVersionHelper(data, apiVersion, () => this.getAvatar()));
      this.setLastVersion(setLastVersionHelper(baseHost, basePath, data, apiVersion));

      const contentAppearancePublished = contentAppearancePublishedHelper(data, apiVersion);
      if (contentAppearancePublished === 'full-width') {
        this.setFullWidth(true);
      } else {
        this.setFullWidth(false);
      }

      // retrieve the header image published and set in context
      const coverPictureIdPublished = coverPictureIdPublishedHelper(data, apiVersion);
      if (coverPictureIdPublished) {
        this.setHeaderImage(JSON.parse(coverPictureIdPublished).id);
        logger.log(
          `GET cover-picture-id-published to set context 'headerImage' to ${this.getHeaderImage()}`,
        );
      } else {
        this.setHeaderImage('');
      }

      // retrieve the header emoji published and set in context
      const emojiTitlePublished = emojiTitlePublishedHelper(data, apiVersion);
      if (emojiTitlePublished) {
        this.setHeaderEmoji(emojiTitlePublished);
        logger.log(
          `GET emoji-title-published to set context 'headerEmoji' to ${this.getHeaderEmoji().code}`,
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

  setBodyStorage(body: string) {
    this.bodyStorage = body;
  }

  getBodyStorage(): string {
    return this.bodyStorage;
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

  setHeaderEmoji(code: string) {
    let emojiType : IconType = 'standard';
    let hexCode = '';
    if (code.length > 12) {
      // Either is a special emoji from Atlassian with ID like 'atlassian-logo_confluence'
      // or a manually uploaded one with ID like '16183a4b-bad2-4f3f-8c7c-3fd9d1c1ccdf'
      emojiType = code.startsWith('atlassian') ? 'atlassian' : 'upload';
      this.headerEmoji = { code, type: emojiType, path: '' };
    } else {
      // ! unclear and to be determined when this is yet needed (probably for a certain type of emoji
      hexCode = `&#x${code};`;
      if (hexCode === '&#x;') {
        this.headerEmoji = { code: '', type: emojiType, path: '' };
      } else {
        this.headerEmoji = { code: hexCode, type: emojiType, path: '' };
      }
    }
  }

  getHeaderEmoji(): EmojiType {
    return this.headerEmoji;
  }

  setApiVersion(version: ApiVersion): void {
    this.apiVersion = version;
  }

  getApiVersion(): ApiVersion {
    return this.apiVersion;
  }
}
