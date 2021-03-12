import TocSection from './TocSection';

export default class Toc extends TocSection {
  render(): string {
    return this.renderingStrategy.renderToc(this);
  }
}
