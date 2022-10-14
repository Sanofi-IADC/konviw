import { Content } from 'src/confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import addNewSlides from './addNewSlides';
import addSlides from './addSlides';

export default (content: Content): Step => (context: ContextService): void => {
    const $ = context.getCheerioBody();

    const isGeneratedNewMacroSlide = $(".conf-macro[data-macro-name='slideCover']").length > 0 ||
        $(".conf-macro[data-macro-name='slideCover']").length > 0;

    if (isGeneratedNewMacroSlide) {
        addNewSlides(content)(context);
    } else {
        addSlides()(context);
    }
}
