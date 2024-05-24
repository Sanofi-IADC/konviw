import * as cheerio from 'cheerio';
import { Logger } from '@nestjs/common';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { DebugIndicator } from '../../common/factory/DebugIndicator';

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
  const debugIndicator = new DebugIndicator(context);
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

  // Let's scrap imgages embedded by Confluence span confluence-embedded-file-wrapper
  $("span.confluence-embedded-file-wrapper:not([data-macro-name='excerpt-include'])")
    .each((_index: number, elementSpan: cheerio.Element) => {
      // $('img.confluence-embedded-image').each((_index: number, elementImg: cheerio.Element) => {
      const caption = imagesXML[_index]?.caption ?? '';
      // for inline images force an small icon of 27px
      if (imagesXML[_index]?.inline) {
        $(elementSpan).parent().wrap('<div class="konviw-embedded-inline-image">');
        $(elementSpan).children().attr('width', '27px');
        // if debug then show the markup
        debugIndicator.mark($(elementSpan).parent(), 'fixCaptionImage-inline');
        logger.log('Fixed width to inline icon');
      } else {
        const imgDataWidth = $(elementSpan).children().attr('width');
        $(elementSpan).wrap('<div>');
        $(elementSpan).wrapInner(`<figure style="width:${imgDataWidth}">`);
        if (caption?.length > 0) {
          $(elementSpan).children().append(`<figcaption>${caption}</figcaption>`);
          logger.log('Fixed caption image');
          debugIndicator.mark($(elementSpan), 'fixCaptionImage-caption');
        }
      }
    });

  context.getPerfMeasure('fixCaptionImage');
};
