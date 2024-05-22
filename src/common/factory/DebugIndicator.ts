import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';

export class DebugIndicator {
  constructor(private conextService: ContextService) {}

  mark(element: cheerio.Cheerio<cheerio.Element>, tag: string): void {
    if (this.conextService.getView() === 'debug') {
      const $ = this.conextService.getCheerioBody();
      $(element).wrap(
        `<div class="debug-macro-indicator debug-${tag}">`,
      );
    }
  }
}
