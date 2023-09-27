import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';

/* eslint-disable no-useless-escape, prefer-regex-literals */
export default (): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('fixProfilePicture');

  const $ = context.getCheerioBody();

  const speakerExceptionText = "Error rendering macro 'profile-picture'";

  $('.cell.aside').each((_, element) => {
    const speakerNotHandled = $(element).find('.innerCell').find('.error').text()
      .includes(speakerExceptionText);

    if (speakerNotHandled) {
      $(element).remove();
    }
  });

  context.getPerfMeasure('fixProfilePicture');
};
