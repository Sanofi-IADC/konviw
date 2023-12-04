import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addZoom');
  const $ = context.getCheerioBody();

  // Div with class profile-macro is used for User Profile VCard
  $('img.confluence-embedded-image').each(
    (_index: number, embeddedImage: cheerio.Element) => {
      const thisBlock = $(embeddedImage).attr('alt');
      if (thisBlock) {
        const foundBlock = thisBlock.match(/\(zoom\)/g);
        if (foundBlock) {
          $(embeddedImage).addClass('konviw-image-zoom-effect');
        }
      }
    },
  );

  context.getPerfMeasure('addZoom');
};
