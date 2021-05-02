import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixDrawio');
    const $ = context.getCheerioBody();
    const webBasePath = config.get('web.basePath');

    // Div class with data-macro-name='drawio' is used for Drawio diagrams created in the same page
    $("div.ap-container[data-macro-name='drawio']").each(
      (_: number, element: CheerioElement) => {
        const thisBlock = $(element).html();
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
          $(element).prepend(
            `<figure><img class="img-zoomable" 
                  src="${webBasePath}/wiki/download/attachments/${pageId}/${diagramName}.png" 
                  alt="${diagramName}" /></figure>`,
          );
        }
      },
    );

    // Div class with data-macro-name='inc-drawio' is used for Drawio diagrams included from other pages
    $("div.ap-container[data-macro-name='inc-drawio']").each(
      (_index: number, element: CheerioElement) => {
        const thisBlock = $(element).html();
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
          $(element).prepend(
            `<figure><img class="img-zoomable" src="${webBasePath}/wiki/download/attachments/${context.getPageId()}/${diagramName}-${aspectHash}.png" alt="${diagramName}" /></figure>`,
          );
        }
      },
    );

    context.getPerfMeasure('fixDrawio');
  };
};
