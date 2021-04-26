import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import Config from '../../config/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixDrawio');
    const $ = context.getCheerioBody();
    const webBasePath = config.get<Config>('web.basePath');

    // Div class with data-macro-name='drawio' is used for Drawio diagrams created in the same page
    $("div.ap-container[data-macro-name='drawio']").each(
      (_index: number, element: CheerioElement) => {
        const thisBlock = $(element).html();
        if (thisBlock) {
          // Finding a block with the pattern diagramDisplayName=<name-file> is enought the determine the name of the file
          const foundBlock = thisBlock.match(
            /pageId=s*([^|]*)|diagramDisplayName=s*([^|]*)/g,
          );
          if (foundBlock) {
            $(element).prepend(
              `<figure><img class="img-zoomable" 
                  src="${webBasePath}/wiki/download/attachments/${context.getPageId()}/${foundBlock[1].replace(
                /pageId=s*([^|]*)|diagramDisplayName=s*([^|]*)/g,
                '$2.png',
              )}" 
                  alt="${foundBlock[1]}" /></figure>`,
            );
          }
        }
      },
    );

    // Div class with data-macro-name='inc-drawio' is used for Drawio diagrams included from other pages
    $("div.ap-container[data-macro-name='inc-drawio']").each(
      (_index: number, element: CheerioElement) => {
        const thisBlock = $(element).html();
        if (thisBlock) {
          // In this case finding a block with the pattern diagramDisplayName=<name-file>
          // is not enought and to  determine the name of the file we need also a hash linked to the file name
          const foundBlock = thisBlock.match(/diagramDisplayName=s*([^|]*)/g);
          const foundHash = thisBlock.match(/\|aspectHash=s*([^|]*)/g);
          if (foundBlock && foundHash) {
            $(element).prepend(
              `<figure><img class="img-zoomable" src="${webBasePath}/wiki/download/attachments/${context.getPageId()}/${foundBlock[0].replace(
                /diagramDisplayName=s*([^|]*)/g,
                '$1',
              )}-${foundHash[0].replace(
                /\|aspectHash=s*([^|]*)/g,
                '$1.png',
              )}" alt="${foundBlock[0]}" /></figure>`,
            );
          }
        }
      },
    );

    context.getPerfMeasure('fixDrawio');
  };
};
