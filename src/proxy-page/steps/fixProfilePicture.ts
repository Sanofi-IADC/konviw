import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';

/* eslint-disable no-useless-escape, prefer-regex-literals */
export default (): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('fixProfilePicture');

  const $ = context.getCheerioBody();

  const speakerExceptionText = "Error rendering macro 'profile-picture'";

  $('.cell').each((_, element) => {
    const errorProfilePictureCaptured = $(element).find('.innerCell').find('.error');
    const exceptionMessageExist = errorProfilePictureCaptured.text()
      .includes(speakerExceptionText);

    if (exceptionMessageExist) {
      $(errorProfilePictureCaptured).remove();
    }
  });

  context.getPerfMeasure('fixProfilePicture');
};
