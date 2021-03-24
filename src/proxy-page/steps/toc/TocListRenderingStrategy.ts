import cheerio from 'cheerio';
import TocRenderingStrategy from './TocRenderingStrategy';
import Toc from './Toc';
import TocSection from './TocSection';

export default class TocListRendringStrategy implements TocRenderingStrategy {
  renderToc(toc: Toc): string {
    return `<ul>${toc.children
      .map((child) => {
        return child.render();
      })
      .filter((child) => {
        return child !== '';
      })
      .join('')}</ul>`;
  }

  renderTocSection(section: TocSection, isHidden: boolean): string {
    const renderedChildren = section.children
      .map((child) => {
        return child.render();
      })
      .filter((child) => {
        return child !== '';
      })
      .join('');

    if (isHidden || !section.title) {
      return renderedChildren;
    }

    const self =
      `<span class="toc-item-body" data-outline="${section.getOutline()}">` +
      `<span class="toc-outline">${section.getOutline()}</span>` +
      `<a href="#${section.id}" class="toc-link">${section.title}</a>` +
      `</span>`;
    const $ = cheerio.load(`<li>${self}</li>`);

    if (renderedChildren !== '') {
      $('li').append(`<ul>${renderedChildren}</ul>`);
    }

    return $.html();
  }
}
