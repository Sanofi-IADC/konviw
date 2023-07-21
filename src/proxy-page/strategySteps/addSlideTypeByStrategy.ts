import { ConfigService } from '@nestjs/config';
import { Content } from '../../confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import addNewSlides from '../steps/addNewSlides';
import addSlides from '../steps/addSlides';
import addMessageLastSlide from '../steps/addMessageLastSlide';

export default (content: Content, config: ConfigService): Step => (context: ContextService): void => {
  const $ = context.getCheerioBody();

  const isGeneratedNewMacroSlide = $(".conf-macro[data-macro-name='slideSettings']").length > 0
        || $(".conf-macro[data-macro-name='slide']").length > 0;

  if (isGeneratedNewMacroSlide) {
    addNewSlides(config, content)(context);
  } else {
    addSlides()(context);
  }
};
