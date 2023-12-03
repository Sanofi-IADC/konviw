import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixTableSize');
  const $ = context.getCheerioBody();

  $('table').each(
    (_macroIndex: number, tableElement: cheerio.Element) => {
      const tableWidth = $(tableElement).attr('data-table-width');
      if (tableWidth) {
        const tableWidthValue = Number(tableWidth);
        if (tableWidthValue > 1400) {
          $(tableElement).css('width', '100%');
        } else {
          $(tableElement).css('width', tableWidth);
        }
      }
    },
  );

  context.getPerfMeasure('fixTableSize');
};
