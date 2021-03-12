import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { performance, PerformanceObserver } from 'perf_hooks';

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);
  private spaceKey = '';
  private pageId = '';
  private theme = 'light';
  private cheerioBody = cheerio.load('');
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

  // ! How to make this working with classic constructor for the class?
  // ! Somehow not working with the @Injectable decorator
  // constructor(private spaceKey: string, private pageId: string, private theme:s tring) {}

  Init(spaceKey: string, pageId: string, theme = '') {
    this.spaceKey = spaceKey;
    this.pageId = pageId;
    this.theme = theme;
    const logger = new Logger();
    // Activate the observer
    this.observer = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0];
      logger.log(`Time for [${entry.name}] = ${entry.duration}ms`);
    });
    this.observer.observe({ entryTypes: ['measure'], buffered: false });
  }

  Close() {
    this.observer.disconnect();
  }

  setPerfMark(mark: string): void {
    performance.mark(`${mark}-init`);
  }

  getPerfMeasure(mark: string): void {
    performance.mark(`${mark}-end`);
    performance.measure(`${mark}`, `${mark}-init`, `${mark}-end`);
  }

  getPageId(): string {
    return this.pageId;
  }

  getTitle(): string {
    return this.title;
  }

  setTitle(title: string): void {
    this.title = title;
  }

  getCheerioBody(): CheerioStatic {
    // getCheerioBody(): any {
    return this.cheerioBody;
  }

  getHtmlBody(): string {
    return this.getCheerioBody().html();
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

  getExcerptBlog(): string {
    return this.excerpt;
  }

  setExcerptBlog(excerpt: any): void {
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
