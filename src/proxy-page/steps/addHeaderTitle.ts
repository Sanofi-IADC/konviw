import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addTitleHeader');
    const $ = context.getCheerioBody();

    if (context.getTitle()) {
      $('#Content').prepend(
        `<h1 class="titlePage">${context.getHeaderEmoji()} ${context.getTitle()}</h1>`,
      );
    }
    context.getPerfMeasure('addTitleHeader');
  };
};
