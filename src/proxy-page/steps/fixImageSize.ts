import * as cheerio from 'cheerio';
import { Logger } from '@nestjs/common';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

/**
 * ### Proxy page step to fix image width
 *
 * This module gets Cheerio to search all images ('img')
 * with class 'confluence-embedded-image' and
 * if the width attr was not directly provided by the API
 * sets the width to display as mini-icon
 *
 * @param  {ConfigService} config
 * @returns void
 */
export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixImageSize');
  const logger = new Logger('fixImageSize');
  const $ = context.getCheerioBody();

  // for images with classes 'image-center', 'image-left' or 'image-right' we force the width
  // attribute if this is not existing. This is a fix for the images before Confluence
  // added the configuration of fixed size in the images
  $(`img.confluence-embedded-image.image-center,
     img.confluence-embedded-image.image-left,
     confluence-embedded-image.image-right`)
    .each((_index: number, elementImg: cheerio.Element) => {
      const imgURL = $(elementImg).attr('src') || $(elementImg).attr('_src');
      const imgDataWidth = $(elementImg).attr('data-width');
      if (imgURL != null && imgDataWidth != null && !$(elementImg).attr('width')) {
        $(elementImg).attr('width', imgDataWidth);
        logger.log('Fixed width to ', imgDataWidth);
      }
    });

  context.getPerfMeasure('fixImageSize');
};
