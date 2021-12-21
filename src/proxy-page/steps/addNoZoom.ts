import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addNoZoom');
    const $ = context.getCheerioBody();

    // Div with class profile-macro is used for User Profile VCard
    $('img.confluence-embedded-image').each(
      (_index: number, embeddedImage: cheerio.Element) => {
        const thisBlock = $(embeddedImage).attr('alt');
        if (thisBlock) {
          const foundBlock = thisBlock.match(/\(nozoom\)/g);
          if (foundBlock) {
            $(embeddedImage).removeClass('confluence-embedded-image');
          }
        }
      },
    );

    context.getPerfMeasure('addNoZoom');
  };
};
