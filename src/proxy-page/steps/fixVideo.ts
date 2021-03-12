import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixVideo');
    const $ = context.getCheerioBody();

    // Div class with span.confluence-embedded-file-wrapper is used for images and videos
    $('span.confluence-embedded-file-wrapper').each(
      (_index: number, fileWrapper: CheerioElement) => {
        const thisBlock = $(fileWrapper).html();
        if (
          // And we search for the attachments which are video format
          thisBlock &&
          thisBlock.match(/href([^|]*)(>.*).(mp4|avi|mov|flv|wmv)/g)
        ) {
          $(fileWrapper).prepend(
            `<video width="400" controls><source src="${$(fileWrapper)
              .children('a')
              .attr('href')}" type="video/mp4"></video>`,
          );
        }
      },
    );

    context.getPerfMeasure('fixVideo');
  };
};
