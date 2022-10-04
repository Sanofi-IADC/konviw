import cheerio from 'cheerio';
import TocRenderingStrategy from './TocRenderingStrategy';
import Toc from './Toc';
import TocSection from './TocSection';

export default class TocListRenderingStrategy implements TocRenderingStrategy {
  /* eslint-disable class-methods-use-this */
  renderToc(toc: Toc): string {
    return `<ul>${toc.children
      .map((child) => child.render())
      .filter((child) => child !== '')
      .join('')}</ul>`;
  }

  renderTocSection(section: TocSection, isHidden: boolean): string {
    const renderedChildren = section.children
      .map((child) => child.render())
      .filter((child) => child !== '')
      .join('');

    if (isHidden || !section.title) {
      return renderedChildren;
    }

    const self = `<span class="toc-item-body" data-outline="${section.getOutline()}">`
      + `<span class="toc-outline">${section.getOutline()}</span>`
      + `<a href="#${section.id}" class="toc-link">${section.title}</a>`
      + '</span>';
    const $ = cheerio.load(`<li>${self}</li>`);

    if (renderedChildren !== '') {
      $('li').append(`<ul>${renderedChildren}</ul>`);
    }

    return $.html();
  }
  /* eslint-enable */
}
