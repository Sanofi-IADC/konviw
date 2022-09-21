import TocSection from './TocSection';

interface TocFilter {
  isHidden(section: TocSection): boolean;
}

export default TocFilter;
