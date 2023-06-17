import { Content } from '../../confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { getMacroSlideSettingsPropertyValueByKey, loadStorageContentToXML } from '../utils/macroSlide';
import { MacroSlideSettingsProperty } from '../utils/macroSlide.interface';

export default (context: ContextService, spaceKey: string, pageId: string, style?: string, content?: Content): void => {
  const storageXML = loadStorageContentToXML(content);

  const {
    exist: existSlideStyle,
    value: valueSlideStyle,
  }: MacroSlideSettingsProperty = getMacroSlideSettingsPropertyValueByKey(storageXML, 'slide_settings_theme', 'digital');

  const {
    exist: existSlideTransition,
    value: valueSlideTransition,
  }: MacroSlideSettingsProperty = getMacroSlideSettingsPropertyValueByKey(storageXML, 'slide_settings_transition', 'slide');

  context.initPageContext(
    spaceKey,
    pageId,
    'light',
    'page', // default 'page' assuming slides not used for blogposts
    existSlideStyle ? valueSlideStyle : style,
    content,
    true,
    '',
  );
  context.setSlideTransition(existSlideTransition ? valueSlideTransition : 'slide');
};
