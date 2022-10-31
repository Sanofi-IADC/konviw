import { Content } from '../../confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { getMacroSlideSettingsPropertyValueByKey, loadStorageContentToXML } from '../utils/macroSlide';

export default (context: ContextService, spaceKey: string, pageId: string, style?: string, content?: Content): void => {
  const storageXML = loadStorageContentToXML(content);

  const { exist, value } = getMacroSlideSettingsPropertyValueByKey(storageXML, 'slide_settings_theme', 'digital');

  const slideStyle = exist ? value : style;

  context.initPageContext(
    spaceKey,
    pageId,
    'light',
    slideStyle,
    content,
    true,
    '',
  );
};
