import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import TocBuilder from './toc/TocBuilder';
import { selectOne } from 'css-select';

export default (): Step => {
  return (context: ContextService): void => {
    const $ = context.getCheerioBody();

    // If the class konviw-float-menu is present, add the floating TOC btn
    const floatTocExists = !!selectOne(
      '.konviw-float-TOC',
      $('#Content').get(),
    );
    if (floatTocExists) {
      addFloatingTocBtn($);
    }

    $('div.client-side-toc-macro').each(
      (_macroIndex: number, elementTOC: cheerio.TagElement) => {
        const tocBuilder = new TocBuilder($(elementTOC).data());

        $('h1,h2,h3,h4,h5,h6').each(
          (_headerIndex: number, header: cheerio.TagElement) => {
            const level = parseInt(header.tagName.replace('h', ''), 10);
            const id = $(header).attr('id');
            if (id === undefined) {
              return; // skip. Confluence headers always have an ID. Otherwise it means it should not appear in the TOC
            }
            tocBuilder.addSection(level, $(header).text(), id);
          },
        );

        $(elementTOC).html(tocBuilder.getToc().render());

        // CssListStyle is managed thanks to inline CSS on every <ul>
        if ($(elementTOC).data('cssliststyle')) {
          $('ul', elementTOC).attr(
            'style',
            `list-style: ${$(elementTOC).data('cssliststyle')};`,
          );
        }

        // Outline is managed thanks to a CSS class
        if ($(elementTOC).data('numberedoutline') !== true) {
          $(elementTOC).addClass('hidden-outline');
        }
      },
    );
  };
};

/**
 *  Add the button to open the floating TOC.
 *  Also add some javascript to manipulate the floating TOC.
 */
const addFloatingTocBtn = ($: cheerio.Root) => {
  $('#Content').append(
    `<button id='floating-toc-btn'>
        <svg style='width:24px;height:24px' viewBox='0 0 24 24'>
          <path fill='currentColor' d='M3,9H17V7H3V9M3,13H17V11H3V13M3,17H17V15H3V17M19,17H21V15H19V17M19,7V9H21V7H19M19,13H21V11H19V13Z' />
        </svg>
      </button>`,
  );
  // Script used to manipulate the floating TOC with the user's intercations
  $('body').append(`
      <script lang='js'>
        const floatingTocBtn = document.getElementById('floating-toc-btn');
        const floatingToc = document.querySelector('div.toc-macro.client-side-toc-macro');
        const floatingTocLinks = floatingToc.querySelectorAll('a.toc-link');
        const activeFloatingToc = () => {
          floatingTocBtn.classList.add('active');
          floatingToc.classList.add('active');
        }
        const desactiveFloatingToc = () => {
          floatingTocBtn.classList.remove('active');
          floatingToc.classList.remove('active');
        }
        const toggleFloatingToc = () => {
          if (floatingTocBtn.classList.contains('active')) {
            desactiveFloatingToc();
          } else {
            activeFloatingToc();
          }
        }
        /* Open and close the floating TOC when click the button */
        floatingTocBtn.addEventListener('click', () => {
          toggleFloatingToc();
        });
        /* Close the floating TOC when click outside */
        document.addEventListener('mouseup', (e) => {
          if (!floatingTocBtn.contains(e.target) &&!floatingToc.contains(e.target)) {
            desactiveFloatingToc();
          }
        });
        /* Close the floating TOC when click on a TOC link */
        floatingTocLinks.forEach(tocLink => {
          tocLink.addEventListener('click', () => {
            desactiveFloatingToc();
          })
        });
      </script>`);
};
