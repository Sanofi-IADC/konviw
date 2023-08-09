import * as cheerio from 'cheerio';
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
  const $ = context.getCheerioBody();
  const xmlStorageFormat = cheerio.load(context.getBodyStorage(), { xmlMode: true });
  const getImageCaption = (elementImg: cheerio.Element) => {
    const filename = elementImg.attribs['data-linked-resource-default-alias'];
    const attachmentContent = xmlStorageFormat(`ri\\:attachment[ri\\:filename="${filename}"]`);
    const caption = Array.from(attachmentContent.parent().children()).find((el) => el.name === 'ac:caption');
    return $(caption).text();
  };

  $('img').each((_index: number, elementImg: cheerio.Element) => {
    const caption = getImageCaption(elementImg);
    if (caption?.length > 0) {
      const parent = $(elementImg).parent();
      parent.append(`<p class="image-caption">${caption}</p>`);
    }
  });

  context.getPerfMeasure('fixCaptionImage');
};
