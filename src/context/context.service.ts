import { Injectable, Logger } from '@nestjs/common';
import cheerio from 'cheerio';
import { performance, PerformanceObserver } from 'perf_hooks';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);
  private spaceKey = '';
  private pageId = '';
  private theme = '';
  private style = '';
  private cheerioBody = cheerio.load('html');
  private title = '';
  private author = '';
  private email = '';
  private avatar = '';
  private excerpt = '';
  private imgblog = '';
  private when = '';
  private friendlyWhen = '';
  private searchResults = '';
  private fullWidth = false;
  private observer: PerformanceObserver;
  constructor(private config: ConfigService) {}

  // ! How to make this working with classic constructor for the class?
  // ! Somehow not working with the @Injectable decorator
  // constructor(private spaceKey: string, private pageId: string, private theme:s tring) {}

  Init(spaceKey: string, pageId: string, theme = '', style = '') {
    this.spaceKey = spaceKey;
    this.pageId = pageId;
    this.theme = theme;
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

  getTitle(): string {
    return this.title;
  }

  setTitle(title: string): void {
    this.title = title;
  }

  getCheerioBody(): cheerio.Root {
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

  setHtmlBody(body: string): void {
    this.cheerioBody = cheerio.load(body);
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

  getTheme(): string {
    return this.theme;
  }

  getStyle(): string {
    return this.style;
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

  getFriendlyWhen(): string {
    return this.friendlyWhen;
  }

  setWhen(when: string): void {
    this.when = when;
    this.friendlyWhen = timeFromNow(when);
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
