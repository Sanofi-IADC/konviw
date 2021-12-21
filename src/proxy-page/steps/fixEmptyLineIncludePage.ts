import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixEmptyLineIncludePage');
    const $ = context.getCheerioBody();

    // Div with class output-block is used for Include Page and it includes
    // an empty p at the end, so we remove it to keep same original layout
    $("div.output-block[data-macro-name='include']").each(
      (_index: number, includePage: cheerio.Element) => {
        if ($(includePage).children().last().get(0).tagName === 'p') {
          $(includePage).children().last().remove();
        }
      },
    );

    context.getPerfMeasure('fixEmptyLineIncludePage');
  };
};
