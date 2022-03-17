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
    $('.unsupported-macro')
    .filter(() => {
      const macroName = $(this).data('macro-name');
      if (macrosFound.indexOf(macroName) !== -1) return false
      macrosFound.push(macroName);
      return true;
    }) // remove duplicates
    .each((_: number, element: cheerio.Element) => {
        const thisBlock = $(element).html();
        if (!thisBlock) return;

        const macroName = $(element).data('macro-name') ?? 'unnamed macro';
        /* TODO add the message at the top of the page with a "toast" design */
        $(element).replaceWith(`
        <span>
            Sorry, unfortunately <b>${macroName}</b> is not supported by Konviw
        </span>`);
    });

    context.getPerfMeasure('addUnsupportedMacroIndicator');
  };
};