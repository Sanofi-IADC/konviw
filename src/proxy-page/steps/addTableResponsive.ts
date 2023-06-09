import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addTableResponsive');
  const $ = context.getCheerioBody();
  // for each table
  $('tbody').each((_index: number, tbodyElement: cheerio.Element) => {
    // Handling headers
    const headers_column: string[] = [];
    const headers_row: string[] = [];
    const tbody = $(tbodyElement);
    // for each row in the table
    const trElements = tbody.find('tr');
    trElements.each((_: number, trElement: cheerio.Element) => {
      const tr = $(trElement);
      const thElement = tr.find('th');
      const tdElement = tr.find('td');
      // row headers and column headers have 2 differents patterns, the column headers are in the first
      // tr full of th for so there is no td in the first tr
      if (tdElement.length === 0) {
        thElement.each((_: number, thElements: cheerio.Element) => {
          const thElement_text = $(thElements).text();
          headers_column.push(thElement_text);
        });
      // for row headers they are situated in the first children of each tr 
      } else {
        const thElement_text = thElement.text();
        if (thElement_text) {
          headers_row.push(thElement_text);
        }
      }
    });
    // case where we have column and row headers we want the column header array to start at 1 for td
    // so if headers_column and headers_row are not both empty
    const slice_number = headers_column.length > 0 && headers_row.length > 0 ? 1 : 0;

    trElements.slice(slice_number).each((_index_row: number, trElement: cheerio.Element) => {
      const row = _index_row;
      const tr = $(trElement);
      const tdElements = tr.find('td');
      tdElements.each((_index_column: number, tdElement: cheerio.Element) => {
        // add header_column and header_row content to each td
        const td = $(tdElement);
        const header_column = headers_column[_index_column + slice_number];
        const header_row = headers_row[row];
        if (!td.attr('data-column-id')) {
          td.attr('data-column-id', header_column);
        }
        if (!td.attr('data-lign-id')) {
          td.attr('data-lign-id', header_row);
        }
      });
    });
  });
  context.getPerfMeasure('addTableResponsive');
};
