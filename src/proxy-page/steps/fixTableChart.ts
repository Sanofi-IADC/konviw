import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

/**
 * ### Proxy page step to flag the table-chart macro as unsupported
 *
 *
 * @param  {ConfigService} config
 * @returns void
 */
export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixTableChart');
    const $ = context.getCheerioBody();

    $('[data-macro-name="table-chart"]').each((_: number, element: cheerio.Element) => {
        const thisBlock = $(element).html();
        if (!thisBlock) return;
        $(element).addClass('unsupported-macro'); // Not supported
    });

    context.getPerfMeasure('fixTableChart');
  };
};
