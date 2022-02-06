import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

/**
 * ### Proxy page step to fix image width
 *
 * This module gets Cheerio to search all images ('img')
 * and set the width according to attribute 'data-width'
 * if the width attr was not directly provided by the API
 *
 * @param  {ConfigService} config
 * @returns void
 */
export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixImageSize');
    const $ = context.getCheerioBody();

    $('img').each((_index: number, elementImg: cheerio.Element) => {
      const imgURL = $(elementImg).attr('src') || $(elementImg).attr('_src');
      const imgDataWidth = $(elementImg).attr('data-width');
      if (
        imgURL != null &&
        imgDataWidth != null &&
        !$(elementImg).attr('width')
      ) {
        $(elementImg).attr('width', imgDataWidth);
      }
    });

    context.getPerfMeasure('fixImageSize');
  };
};
