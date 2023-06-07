import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addTableResponsive');
  const $ = context.getCheerioBody();
  $('tbody').each((_index: number, tbodyElement: cheerio.Element) => {
    // Handling headers
    const headers: string[] = [];
    const headers_lign: string[] = [];
    const tbody = $(tbodyElement);
    const trElements = tbody.find('tr');
    trElements.each((_index1: number, trElement: cheerio.Element) => {
      const tr = $(trElement);
      const thElement = tr.find('th');
      const tdElement = tr.find('td');
      if (tdElement.length === 0) {
        thElement.each((_index2: number, thElements: cheerio.Element) => {
          const thElement_text = $(thElements).text();
          headers.push(thElement_text);
        });
      } else {
        const thElement_text = thElement.text();
        if (thElement_text.length !== 0) {
          headers_lign.push(thElement_text);
        }
      }
    });
    const slice_number = headers.length !== 0 && headers_lign.length !== 0 ? 1 : 0;

    trElements.slice(slice_number).each((_index3: number, trElement: cheerio.Element) => {
      const ligne = _index3;
      const tr = $(trElement);
      const tdElements = tr.find('td');
      tdElements.each((_index4: number, tdElement: cheerio.Element) => {
        const td = $(tdElement);
        const header = headers[_index4 + slice_number];
        const header_lign = headers_lign[ligne];
        if (!td.attr('data-column-id')) {
          td.attr('data-column-id', header);
        }
        if (!td.attr('data-lign-id')) {
          td.attr('data-lign-id', header_lign);
        }
      });
    });
  });
  context.getPerfMeasure('addTableResponsive');
};
