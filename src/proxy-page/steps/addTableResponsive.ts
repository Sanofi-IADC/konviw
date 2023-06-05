import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addTableResponsive');
  const $ = context.getCheerioBody();
  $('tbody').each((_index: number, tbodyElement: cheerio.Element) => {
    const headers: string[] = [];
    const tbody = $(tbodyElement);
    
    // Récupérer les en-têtes de colonne (<th>)
    const thElements = tbody.find('th');
    thElements.each((_index, thElement) => {
      const thText = $(thElement).text();
      headers.push(thText);
    });
    
    const trElements = tbody.find('tr');
    trElements.slice(1).each((_index, trElement) => {
      const tr = $(trElement);
      const tdElements = tr.find('td');
      tdElements.each((_index, tdElement) => {
        const td = $(tdElement);
        const header = headers[_index];
        
        if (!td.attr('data-column-id')) {
          td.attr('data-column-id', header);
        }
      });
    });
  });
  context.getPerfMeasure('addTableResponsive');
};