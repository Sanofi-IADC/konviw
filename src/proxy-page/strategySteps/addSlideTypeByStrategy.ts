import { ConfigService } from '@nestjs/config';
import { ConfluenceRestAPIv2PageContent } from '../../confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import addNewSlides from '../steps/addNewSlides';
import addSlides from '../steps/addSlides';

export default (content: ConfluenceRestAPIv2PageContent, config: ConfigService): Step => (context: ContextService): void => {
  const $ = context.getCheerioBody();

  const isGeneratedNewMacroSlide = $(".conf-macro[data-macro-name='slideSettings']").length > 0
        || $(".conf-macro[data-macro-name='slide']").length > 0;

  if (isGeneratedNewMacroSlide) {
    addNewSlides(config, content)(context);
  } else {
    addSlides()(context);
  }
};
