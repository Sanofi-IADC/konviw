import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixChartMacro');
    const $ = context.getCheerioBody();
    const webBasePath = config.get('web.basePath');

    // Div class with data-macro-name='drawio' is used for Drawio diagrams created in the same page
    // $('script.chart-render-data').each((_: number, element: CheerioElement) => {
    $('.chart-bootstrap-wrapper').each((_: number, element: CheerioElement) => {
      const thisBlock = $(element).html();
      if (!thisBlock) {
        return;
      }
      const attachmentRegex = new RegExp(
        // Will find <^FileName.png> in => "parameters":{ ... "attachment":"<^FileName.png>" ... }
        /"parameters":.*"attachment":"\^(.*?)"/g,
      ).exec(thisBlock);
      // The previous RegExp is not taking into account the option to save attachment in another pag
      // like the Conflence documentation describe in https://support.atlassian.com/confluence-cloud/docs/insert-the-chart-macro/#ChartMacro-AttachmentParameters
      // with options (only covering today the first one)
      // - ^attachmentName.png — the chart is saved as an attachment to the current page.
      // - page^attachmentName.png — the chart is saved as an attachment to the page name provided.
      // - space:page^attachmentName.png — the chart is saved as an attachment to the page name provided in the space indicated.
      const [, attachment] = attachmentRegex ?? [];

      if (attachment) {
        $(element).prepend(
          `<figure><img class="img-zoomable" 
                  src="${webBasePath}/wiki/download/attachments/${context.getPageId()}/${attachment}" 
                  alt="${attachment}" /></figure>`,
        );
      }
    });

    context.getPerfMeasure('fixChartMacro');
  };
};
