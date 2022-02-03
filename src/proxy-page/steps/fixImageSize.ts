import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

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
  };
};
