import * as cheerio from 'cheerio';
import { Content } from '../../confluence/confluence.interface';

export const loadStorageContentToXML = (content: Content) => cheerio.load(content.body.storage.value ?? '', { xmlMode: true });

export const getSlideMacroTheme = ($storageContent: cheerio.CheerioAPI) => {
  const findMacroSlideTheme = $storageContent('ac\\:parameter[ac\\:name="slide_theme"]');
  const getMacroSlideThemeObject = findMacroSlideTheme && findMacroSlideTheme['0'];
  const macroSlideThemeObjectChild = getMacroSlideThemeObject && getMacroSlideThemeObject.children[0] as any;
  return {
    isMacroSlide: Boolean(findMacroSlideTheme),
    macroSlideStyle: (macroSlideThemeObjectChild && macroSlideThemeObjectChild.data) ?? 'digital',
  };
};

export const getObjectFromStorageXMLForPageProperties = (pageProperties: cheerio.Element, content: Content): any => {
  const $storageContent = loadStorageContentToXML(content);
  const dataLocalId = pageProperties.attribs['data-local-id'];
  const storageXML = $storageContent(`ac\\:structured-macro[ac\\:local-id="${dataLocalId}"]`);
  return storageXML;
};

export const getAttribiutesFromChildren = (storageXML: cheerio.Cheerio<cheerio.Element>): { options: any; attachments: any } => {
  const options = getAttribiutesFromChildrenByType(storageXML, 'options');
  const attachments = getAttribiutesFromChildrenByType(storageXML, 'attachments');
  return {
    options,
    attachments,
  };
};

const getAttribiutesFromChildrenByType = (
  storageXML: cheerio.Cheerio<cheerio.Element>,
  type: string,
) => storageXML.children().map((_, element: any) => {
  const dataInput = element.children && element.children[0];
  if (dataInput) {
    if (type === 'attachments') {
      const attachmentSlideAttribs = dataInput.attribs;
      const attachmentSlideUrl = attachmentSlideAttribs && attachmentSlideAttribs['ri:filename'];
      return attachmentSlideUrl;
    }
    return dataInput.data;
  }
  return undefined;
});
