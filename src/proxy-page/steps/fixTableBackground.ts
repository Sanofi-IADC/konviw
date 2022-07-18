import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixTableBackground');
    const $ = context.getCheerioBody();

    $('.confluenceTh, .confluenceTd').each((_macroIndex: number, headerElement: cheerio.Element) => { 
      const hightlightColour = $(headerElement).attr('data-highlight-colour');
      if (hightlightColour) {
        $(headerElement).css('background-color', hightlightColour);
      }
    });

    context.getPerfMeasure('fixTableBackground');
  };
};
