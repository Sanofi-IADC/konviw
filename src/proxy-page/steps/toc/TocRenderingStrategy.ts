import Toc from './Toc';
import TocSection from './TocSection';

interface TocRenderingStrategy {
  renderToc(toc: Toc): string;
  renderTocSection(section: TocSection, isHidden: boolean): string;
}

export default TocRenderingStrategy;
