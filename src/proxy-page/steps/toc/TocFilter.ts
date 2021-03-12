import TocSection from './TocSection';

export default interface TocFilter {
  isHidden(section: TocSection): boolean;
}
