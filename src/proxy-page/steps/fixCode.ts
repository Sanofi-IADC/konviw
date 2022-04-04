import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixCode');
    const $ = context.getCheerioBody();

    $('pre.syntaxhighlighter-pre').each(
      (_index: number, elementCode: cheerio.Element) => {
        // if debug then show the macro debug frame
        if (context.getView() === 'debug') {
          $(elementCode).wrap(
            `<div class="debug-macro-indicator debug-macro-code">`,
          );
        }
        $(elementCode).replaceWith(
          `<pre><code>${$(elementCode).html()}</code></pre>`,
        );
      },
    );

    context.getPerfMeasure('fixCode');
  };
};
