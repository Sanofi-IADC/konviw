import TocFilter from './TocFilter';
import TocSection from './TocSection';

export default class TocIncludeRegexFilter implements TocFilter {
  readonly regex: RegExp;

  constructor(regexStr: string) {
    this.regex = new RegExp(regexStr);
  }

  isHidden(section: TocSection): boolean {
    return section.title !== undefined && !this.regex.test(section.title);
  }
}
