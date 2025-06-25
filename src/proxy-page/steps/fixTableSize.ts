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
        // when data-table-width is <760 the table will not be full width but actual size
        if (tableWidthValue < 800) {
          $(tableElement).css('width', tableWidth);
          $(tableElement).attr('data-konviw-table-size', 'small');
        } else {
          $(tableElement).attr('data-konviw-table-size', 'large');
        }
      }
    },
  );

  context.getPerfMeasure('fixTableSize');
};
