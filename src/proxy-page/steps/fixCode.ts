import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixCode');
    const $ = context.getCheerioBody();

    $('pre.syntaxhighlighter-pre').each(
      (_index: number, elementCode: cheerio.Element) => {
        $(elementCode).replaceWith(
          `<pre><code>${$(elementCode).html()}</code></pre>`,
        );
      },
    );

    context.getPerfMeasure('fixCode');
  };
};
