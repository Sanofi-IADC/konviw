import { ContextService } from '../../context/context.service';
import { Step } from '../../proxy-page/proxy-page.step';
import * as cheerio from 'cheerio';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('getFirstExcerpt');
    const $ = context.getCheerioBody();

    // Excerpt macro is parsed as a span block with classes 'conf-macro' and 'output-inline'
    // and data-macro-name='excerpt'
    // Unfortunately if the property hidden=true the styled_body will not return the excerpt
    context.setExcerpt('');
    $("span.conf-macro.output-inline[data-macro-name='excerpt']")
      .first()
      .each((_index: number, elementExcerpt: cheerio.Element) => {
        const excerptPage = $(elementExcerpt);
        context.setExcerpt(excerptPage.text());
      });

    context.getPerfMeasure('getFirstExcerpt');
  };
};
