import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('delUnnecessaryCode');
  const $ = context.getCheerioBody();

  // Remove buggy inline CSS from <head> (mix of CSS and SaSS) -> replaced by aui.css
  // $('head > style').remove();

  // Remove <base ...> to fix TOC links
  $('base').remove();

  // Remove button to insert templates in Confluence
  $('button.create-from-template-button').remove();

  // Remove unnecessary components from Attachments list macro

  $('th.attachment-summary-toggle').remove();
  $('td.attachment-summary-toggle').remove();
  $('div.plugin_attachments_upload_container').remove();
  $('a.download-all-link').remove();

  // Remove this Drawio script to remove unnecessary noise in the final HTML
  $('script.ap-iframe-body-script').each(
    (_index: number, elementDrawio: cheerio.Element) => {
      $(elementDrawio).replaceWith('');
    },
  );

  context.getPerfMeasure('delUnnecessaryCode');
};
