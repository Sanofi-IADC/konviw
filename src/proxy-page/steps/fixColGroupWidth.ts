import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

/**
 * ### Proxy page step to fix colgroup width
 *
 * This module gets Cheerio to search all colgroup ('colgroup')
 * and convert the width to the proportional percentage
 * when the width sum of colgroup more than 1000
 *
 * @param  {ConfigService} config
 * @returns void
 */

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixColgroupWidth');
  const $ = context.getCheerioBody();
  $(
    // similar to 'table:not([data-layout="default"])>colgroup' we apply to fill-width and wide tables
    // Since Atlassian changed to fixed tabled it does not return anymore the data-layout via API
    // https://community.atlassian.com/t5/Confluence-articles/Resize-Confluence-tables-to-any-width/ba-p/2483925
    // consequently we apply now the calculation in % for all size of tables, while always returns "default"
    `table[data-layout='full-width']>colgroup,
    table[data-layout= 'wide']> colgroup,
    table[data-layout='default']>colgroup`,
  ).each((_index: number, elementColgroup: cheerio.Element) => {
    let sumColWidth = 0;
    elementColgroup.childNodes.forEach((elementColumn: cheerio.Element) => {
      sumColWidth += getElementValue(elementColumn);
    });
    // if (sumColWidth > maxColWidth) {
    elementColgroup.childNodes.forEach((elementColumn: cheerio.Element) => {
      const newWidth = Math.round(
        (getElementValue(elementColumn) / sumColWidth) * 100,
      );
      elementColumn.attribs = { style: `width: ${newWidth}%;` }; // eslint-disable-line no-param-reassign
    });
    // }
  });
  context.getPerfMeasure('fixColgroupWidth');
};

function getElementValue(elementColumn: cheerio.Element): number {
  const attribs = JSON.parse(JSON.stringify(elementColumn.attribs));
  // default value for columns where there is no width defined
  const defaultWidth = 50;
  return attribs.style ? Number(attribs?.style?.match(/\d+/)[0] ?? 0) : defaultWidth;
}
