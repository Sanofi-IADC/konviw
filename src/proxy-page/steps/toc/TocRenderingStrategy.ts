import Toc from './Toc';
import TocSection from './TocSection';

export default interface TocRenderingStrategy {
  renderToc(toc: Toc): string;
  renderTocSection(section: TocSection, isHidden: boolean): string;
}
