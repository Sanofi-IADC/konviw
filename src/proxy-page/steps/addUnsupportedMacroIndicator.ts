import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

/**
 * ### Proxy page step to notify the unprocessed/unsupported macros in the page
 *
 *
 * @param  {ConfigService} config
 * @returns void
 */
 export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addUnsupportedMacroIndicator');
    const $ = context.getCheerioBody();

    const macrosFound = [];
    $(
      /* Pagetree and table-chart macros */
      `[data-macro-name="pagetree"],
      [data-macro-name="table-chart"]`
    )
    .filter(() => {
      const macroName = $(this).data('macro-name') ?? '';
      if (macrosFound.indexOf(macroName) !== -1) return false;
      macrosFound.push(macroName);
      return true;
    }) // remove duplicates
    .each((_: number, element: cheerio.Element) => {
        const thisBlock = $(element).html();
        if (!thisBlock) return;

        const macroName = $(element).data('macro-name') ?? 'unnamed macro';
        $(element).replaceWith('');

        if (context.getView() === 'debug') {          
          $('#Content h1').after(`
          <div class="unsupported-macro-indicator">
            Sorry, unfortunately <b>${macroName}</b> is not supported by Konviw
            <span class="cross" onclick="(() => {this.parentNode.classList.add('hidden')})()">x</span>
          </div>`);        
        }
    });
    context.getPerfMeasure('addUnsupportedMacroIndicator');
  };
};