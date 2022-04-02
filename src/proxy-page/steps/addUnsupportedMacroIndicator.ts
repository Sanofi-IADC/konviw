import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

/**
 * ### Proxy page step to notify the unprocessed/unsupported macros in the page
 *
 * @param  {ConfigService} config
 * @returns void
 */
export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addUnsupportedMacroIndicator');
    const $ = context.getCheerioBody();

    $(
      /* List of unsupported macros */
      `[data-macro-name="pagetree"],
      [data-macro-name="table-chart"],
      [data-macro-name="pagetreesearch"]`,
    ).each((_: number, element: cheerio.Element) => {
      const thisBlock = $(element).html();
      if (!thisBlock) return;
      const macroName = $(element).data('macro-name') ?? 'unnamed macro';
      if (context.getView() === 'debug') {
        // not yet working the display of the macroName, while it works in console.log not in html
        // console.log('unsupported', macroName);
        $(element).wrap(`<div class="unsupported-macro-indicator">
          😞 Sorry, unfortunately ${macroName} is not supported by Konviw
          <span class="cross" onclick="(() => {this.parentNode.classList.add('hidden')})()">
          `);
      }
      $(element).remove();
    });
    context.getPerfMeasure('addUnsupportedMacroIndicator');
  };
};
