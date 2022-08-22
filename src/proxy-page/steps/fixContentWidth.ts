import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixContentWidth');
  const $ = context.getCheerioBody();

  if (context.isFullWidth()) {
    $('#Content').addClass('fullWidth');
  }

  context.getPerfMeasure('fixContentWidth');
};
