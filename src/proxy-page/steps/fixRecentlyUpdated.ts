import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixRecentlyUpdated');
  const $ = context.getCheerioBody();

  // Remove Show More...
  $('.recently-updated .hidden').remove();
  $('.recently-updated .more-link-container').remove();

  context.getPerfMeasure('fixRecentlyUpdated');
};
