import TocFilter from './TocFilter';
import TocSection from './TocSection';

export default class TocExcludeRegexFilter implements TocFilter {
  readonly regex: RegExp;

  constructor(regexStr: string) {
    this.regex = new RegExp(regexStr);
  }

  isHidden(section: TocSection): boolean {
    return this.regex.test(section.title || '');
  }
}
