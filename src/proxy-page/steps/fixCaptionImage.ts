import * as cheerio from 'cheerio';
import { Logger } from '@nestjs/common';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

/**
 * ### Proxy page step to fix image caiption
 *
 * This module gets Cheerio to search all images ('img')
 * and set the caption according to child 'ac:caption'
 *
 * @param  {ConfigService} config
 * @returns void
 */
export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixCaptionImage');
  const logger = new Logger('fixCaptionImage');
  const $ = context.getCheerioBody();

  // Confluence sometimes ships metadata in body-format=storage which is not
  // available in body-storage=view
  const $xml = cheerio.load(context.getBodyStorage(), { xmlMode: true });

  // Let's load the metadata related to the images in the current page: filename, caption and inline status
  const imagesXML = $xml('ac\\:image').map((_index: number, elementImg: cheerio.Element) =>
    ({
      filename: $xml(elementImg).find('ri\\:attachment').attr('ri:filename'),
      caption: $xml(elementImg).find('ac\\:caption').text(),
      inline: $xml(elementImg).attr('ac:inline') !== undefined,
    })).get();

  // Let's scrap imgages embedded by Confluence
  $('img.confluence-embedded-image').each((_index: number, elementImg: cheerio.Element) => {
    const caption = imagesXML[_index]?.caption ?? '';
    // for inline images force an small icon of 27px
    if (imagesXML[_index]?.inline) {
      $(elementImg).parent().parent().wrap('<div class="konviw-embedded-inline-image">');
      $(elementImg).attr('width', '27px');
      // if debug then show the markup
      addDebug($, $(elementImg).parent().parent(), 'fixCaptionImage-inline', context);
      logger.log('Fixed width to inline icon');
    } else {
      const imgDataWidth = $(elementImg).attr('width');
      $(elementImg).parent().wrap('<div>');
      $(elementImg).wrap(`<figure style="width:${imgDataWidth}">`);
      if (caption?.length > 0) {
        $(elementImg).parent().append(`<figcaption>${caption}</figcaption>`);
        logger.log('Fixed caption image');
      }
      // if debug then show the markup
      addDebug($, $(elementImg).parent(), 'fixCaptionImage', context);
    }
  });

  context.getPerfMeasure('fixCaptionImage');
};

// TODO! Refactor this function as a middleware or Factory to add debug markup similarly to the logger
const addDebug = ($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>, tag: string, context:ContextService): void => {
  // if debug then show the macro debug frame
  if (context.getView() === 'debug') {
    $(element).wrap(
      `<div class="debug-macro-indicator debug-${tag}">`,
    );
  }
};
