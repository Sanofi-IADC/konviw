import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixTableColGroup');
    const $ = context.getCheerioBody();

    // Remove colgroup to make the tables responsive and taking the full space of the viewport
    $('table.confluenceTable > colgroup').remove();

    context.getPerfMeasure('fixTableColGroup');
  };
};
