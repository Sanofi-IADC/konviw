import TocFilter from './TocFilter';
import TocSection from './TocSection';

export default class TocSectionLevelFilter implements TocFilter {
  constructor(readonly allowedLevels: number[]) {}

  isHidden(section: TocSection): boolean {
    return !this.allowedLevels.includes(section.getLevel());
  }
}
