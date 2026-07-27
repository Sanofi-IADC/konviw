import { Content } from '../../confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { setBodyStorageHelper } from '../../context/context.helpers';
import { getMacroSlideSettingsPropertyValueByKey, loadStorageContentToXML } from '../utils/macroSlide';
import { MacroSlideSettingsProperty } from '../utils/macroSlide.interface';

export default (
  context: ContextService,
  spaceKey: string,
  pageId: string,
  style?: string,
  content?: Content,
): void => {
  // Populate the storage body up-front so the slide macro settings can be read
  // before the full page context is initialized below. Guard against a missing
  // content object or an empty storage body so cheerio always receives a string.
  const bodyStorage = content ? (setBodyStorageHelper(content, 'v2') ?? '') : '';
  context.setBodyStorage(bodyStorage);
  const storageXML = loadStorageContentToXML(context);

  const {
    exist: existSlideStyle,
    value: valueSlideStyle,
  }: MacroSlideSettingsProperty = getMacroSlideSettingsPropertyValueByKey(storageXML, 'slide_settings_theme', 'digital');

  const {
    exist: existSlideTransition,
    value: valueSlideTransition,
  }: MacroSlideSettingsProperty = getMacroSlideSettingsPropertyValueByKey(storageXML, 'slide_settings_transition', 'slide');

  context.initPageContext(
    'v2',
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
