import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import TocBuilder from './toc/TocBuilder';

export default (): Step => {
  return (context: ContextService): void => {
    const $ = context.getCheerioBody();

    $('div.client-side-toc-macro').each(
      (_macroIndex: number, macro: CheerioElement) => {
        const tocBuilder = new TocBuilder($(macro).data());

        $('h1,h2,h3,h4,h5,h6,h7').each(
          (_headerIndex: number, header: CheerioElement) => {
            const level = parseInt(header.tagName.replace('h', ''), 10);
            const id = $(header).attr('id');
            if (id === undefined) {
              return; // skip. Confluence headers always have an ID. Otherwise it means it should not appear in the TOC
            }
            tocBuilder.addSection(level, $(header).text(), id);
          },
        );

        $(macro).html(tocBuilder.getToc().render());

        // CssListStyle is managed thanks to inline CSS on every <ul>
        if ($(macro).data('cssliststyle')) {
          $('ul', macro).attr(
            'style',
            `list-style: ${$(macro).data('cssliststyle')};`,
          );
        }

        // Outline is managed thanks to a CSS class
        if ($(macro).data('numberedoutline') !== true) {
          $(macro).addClass('hidden-outline');
        }
      },
    );
  };
};
