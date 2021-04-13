/* eslint-disable class-methods-use-this */
import TocRenderingStrategy from './TocRenderingStrategy';
import Toc from './Toc';
import TocSection from './TocSection';

export default class TocFlatRenderingStrategy implements TocRenderingStrategy {
  constructor(readonly midSeparator = '') {}

  private $getMidSeparator(): string {
    return this.midSeparator === ''
      ? ''
      : `<span class="toc-separator">${this.midSeparator}</span>`;
  }

  renderToc(toc: Toc): string {
    return `<span class="toc-item-container">${toc.children
      .map((child) => {
        return child.render();
      })
      .filter((child) => {
        return child !== '';
      })
      .join(this.$getMidSeparator())}</span>`;
  }

  renderTocSection(section: TocSection, isHidden: boolean): string {
    const self =
      isHidden || !section.title
        ? ''
        : `<span class="toc-item-body" data-outline="${section.getOutline()}">` +
          `<span class="toc-outline">${section.getOutline()}</span>` +
          `<a href="#${section.id}" class="toc-link">${section.title}</a>` +
          `</span>`;

    const renderedChildren = section.children
      .map((child) => {
        return child.render();
      })
      .filter((child) => {
        return child !== '';
      })
      .join(this.$getMidSeparator());

    const separator =
      self !== '' && renderedChildren !== '' ? this.$getMidSeparator() : '';

    return `${self}${separator}${renderedChildren}`;
  }
}
