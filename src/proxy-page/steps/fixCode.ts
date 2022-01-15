import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addHighlightjs');
    const $ = context.getCheerioBody();

    $('pre.syntaxhighlighter-pre').each(
      (_index: number, elementCode: cheerio.Element) => {
        $(elementCode).wrap(`<pre><code>`);
      },
    );

    context.getPerfMeasure('addHighlightjs');
  };
};
