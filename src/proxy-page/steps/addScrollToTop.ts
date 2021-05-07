import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addScrollToTop');
    const $ = context.getCheerioBody();

    $('#Content').append(
      `<div class="back-to-top-wrapper">
        <a href="#" class="back-to-top-link" aria-label="Scroll to Top"></a>
      </div>`,
    );
    context.getPerfMeasure('addScrollToTop');
  };
};
