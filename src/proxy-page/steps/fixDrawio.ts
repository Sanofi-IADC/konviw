import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';

/**
 * ### Proxy page step to replace drawio macro by the image generated by Confluence as attachment in the page.
 *
 * This module gets Cheerio to parse the page body and search for
 * `div.ap-container[data-macro-name='drawio']` which is used to wrap the
 * drawio macro meta-data for diagrams created in the same page and search for
 * `div.ap-container[data-macro-name='inc-drawio']` which is used for
 * embedded diagrams from other pages
 *
 * @param  {ConfigService} config
 * @returns void
 */
export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixDrawio');
    const $ = context.getCheerioBody();
    const webBasePath = config.get('web.basePath');

    // Div class with data-macro-name='drawio' is used for Drawio diagrams created in the same page
    $(
      ".ap-container[data-macro-name='drawio'], .ap-container[data-macro-name='drawio-sketch']",
    ).each((_: number, elementDrawio: cheerio.TagElement) => {
      const thisBlock = $(elementDrawio).html();
      if (!thisBlock) {
        return;
      }
      const pageIdRegex = new RegExp(
        // Will find <pageId> in => "productCtx": { ... "page.id": "<pageId>" ... }
        /"productCtx".*"page.id\\":\\"(\d*)\\"/g,
      ).exec(thisBlock);
      const diagramNameRegex = new RegExp(
        // Will find <diagramName> in => "productCtx": { ... ": = | RAW | = :": ... |<diagramName>| ..." ... }
        '"productCtx".*diagramName=([^|]*).*,',
      ).exec(thisBlock);

      const [, pageId] = pageIdRegex ?? [];
      const [, diagramName] = diagramNameRegex ?? [];

      if (pageId && diagramName) {
        $(elementDrawio).prepend(
          `<figure><img class="img-zoomable"
                  src="${webBasePath}/wiki/download/attachments/${pageId}/${diagramName}.png"
                  alt="${diagramName}" /></figure>`,
        );
      }
    });

    // Div class with data-macro-name='inc-drawio' is used for Drawio diagrams included from other pages
    $(".ap-container[data-macro-name='inc-drawio']").each(
      (_index: number, elementDrawio: cheerio.TagElement) => {
        const thisBlock = $(elementDrawio).html();
        if (!thisBlock) {
          return;
        }
        // In this case finding a block with the pattern diagramDisplayName=<name-file>
        // is not enought and to  determine the name of the file we need also a hash linked to the file name
        const diagramNameRegex = new RegExp(
          // Will find <diagramName> in => "productCtx": { ... ": = | RAW | = :": ... |<diagramName>| ..." ... }
          '"productCtx".*diagramName=([^|]*).*,',
        ).exec(thisBlock);
        const aspectHashRegex = new RegExp(
          '"productCtx".*aspectHash=([^|]*).*,',
        ).exec(thisBlock);

        const [, diagramName] = diagramNameRegex ?? [];
        const [, aspectHash] = aspectHashRegex ?? [];

        if (diagramName && aspectHash) {
          $(elementDrawio).prepend(
            `<figure><img class="img-zoomable" src="${webBasePath}/wiki/download/attachments/${context.getPageId()}/${diagramName}-${aspectHash}.png" alt="${diagramName}" /></figure>`,
          );
        }
      },
    );

    // Remove this Drawio script to remove unnecessary noise in the final HTML
    $('script.ap-iframe-body-script').each(
      (_index: number, elementDrawio: cheerio.TagElement) => {
        $(elementDrawio).replaceWith('');
      },
    );

    context.getPerfMeasure('fixDrawio');
  };
};