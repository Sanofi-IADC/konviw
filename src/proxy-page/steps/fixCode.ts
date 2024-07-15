import * as cheerio from 'cheerio';
import { Logger } from '@nestjs/common';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { DebugIndicator } from '../../common/factory/DebugIndicator';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixCode');
  const logger = new Logger('fixCode');
  const debugIndicator = new DebugIndicator(context);
  const $ = context.getCheerioBody();

  $('pre.syntaxhighlighter-pre').each(
    (_index: number, elementCode: cheerio.Element) => {
      $(elementCode).replaceWith(
        `<pre><code>${$(elementCode).html()}</code></pre>`,
      );
      logger.log('Fixed code block');
      // if debug then show the macro debug frame
      debugIndicator.mark($(elementCode), 'fixCode');
    },
  );

  context.getPerfMeasure('fixCode');
};
