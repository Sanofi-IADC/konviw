import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addTableResponsive');
  const $ = context.getCheerioBody();
  $('tbody').each((_index: number, tbodyElement: cheerio.Element) => {
    //handling headers
    const headers: string[] = [];
    const headers_lign: string[] = [];
    const tbody = $(tbodyElement);
    const trElements = tbody.find('tr');
    trElements.each((_index: number, trElement: cheerio.Element) => {
        const tr = $(trElement);
        const thElement = tr.find('th');
        const tdElement = tr.find('td');
        
        if (tdElement.length === 0) {
          thElement.each((_index, thElement) => {
            const thElement_text = $(thElement).text();
            headers.push(thElement_text);
          });
        } else {
          const thElement_text = thElement.text()
          if (thElement_text.length !=0){
            headers_lign.push(thElement_text);
          }
        }
    });
    let slice_number = 0;
    if (headers.length!=0 && headers_lign.length!=0){
        slice_number =1;
    }
    trElements.slice(slice_number).each((_index, trElement) => {
      let ligne = _index;
      const tr = $(trElement);
      const tdElements = tr.find('td');
      tdElements.each((_index, tdElement) => {
        const td = $(tdElement);
        const header = headers[_index+slice_number];  
        const header_lign = headers_lign[ligne]; 
        if (!td.attr('data-column-id')) {
          td.attr('data-column-id', header);
        }
        if (!td.attr('data-lign-id')) {
            td.attr('data-lign-id',header_lign);
          }
      });
    });
  });
  context.getPerfMeasure('addTableResponsive');
};