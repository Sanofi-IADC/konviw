import { Content } from '../../confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { getSlideMacroTheme, loadStorageContentToXML } from '../utils/macroSlide';

export default (context: ContextService, spaceKey: string, pageId: string, style?: string, content?: Content): void => {
  context.setPerfMark('addSlideContentByStrategy');

  const $ = context.getCheerioBody();

  const storageXML = loadStorageContentToXML(content);

  const { isMacroSlide, macroSlideStyle } = getSlideMacroTheme(storageXML);

  const slideStyle = isMacroSlide ? macroSlideStyle : style;

  context.initPageContext(
    spaceKey,
    pageId,
    'light',
    slideStyle,
    content,
    true,
    '',
  );

  context.getPerfMeasure('addSlideContentByStrategy');
};
