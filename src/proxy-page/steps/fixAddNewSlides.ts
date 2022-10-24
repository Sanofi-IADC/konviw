import * as cheerio from 'cheerio';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixNewSlides');

  const $ = context.getCheerioBody();

  $(".conf-macro[data-macro-name='slideSettings']").each((_: number, pageProperties: cheerio.Element) => {
    $(pageProperties).replaceWith('');
  });

  context.getPerfMeasure('fixNewSlides');
};
