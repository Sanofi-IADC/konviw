import * as cheerio from 'cheerio';
import { Logger } from '@nestjs/common';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import { DebugIndicator } from '../../common/factory/DebugIndicator';

/* eslint-disable no-useless-escape, prefer-regex-literals */
export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixEmbeddedFile');
  const logger = new Logger('fixEmbeddedFile');
  const debugIndicator = new DebugIndicator(context);
  const $ = context.getCheerioBody();

  $('a.confluence-embedded-file').each(
    (_index: number, elementCode: cheerio.Element) => {
      // retrieve the filename to display under the thumbnail or as text for the link
      const fileName = $(elementCode).attr('data-linked-resource-default-alias');
      if ($(elementCode).parent().parent().hasClass('media-group')) {
        // for embedded files with media-group we wrap the whole a node with a new div and class
        // to be able to customize accordingly the display of the thumbnail and caption
        $(elementCode).parent().parent().wrap('<div class="konviw-embedded-file">');
        $(elementCode).parent().parent().append(`<span class="konviw-embedded-file-caption">${fileName}</span>`);
        logger.log('Fixed embedded file with thumbnail');
        debugIndicator.mark($(elementCode), 'fixEmbeddedFile-thumbnail');
      } else {
        // if there is no media-group class we will add simply the filename to the link
        $(elementCode).text(fileName);
        $(elementCode).addClass('konviw-embedded-file-icon');
        logger.log('Fixed embedded inline file');
        debugIndicator.mark($(elementCode), 'fixEmbeddedFile-inline');
      }
    },
  );

  context.getPerfMeasure('fixEmbeddedFile');
};
