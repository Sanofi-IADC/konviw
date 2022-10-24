import * as cheerio from 'cheerio';
import { Content } from '../../confluence/confluence.interface';

export const loadStorageContentToXML = (content: Content) => cheerio.load(content?.body?.storage?.value ?? '', { xmlMode: true });

export const getMacroSlideSettingsPropertyValueByKey = ($storageContent: cheerio.CheerioAPI, key: string, defaultValue: string) => {
  const findElement = $storageContent(`ac\\:parameter[ac\\:name="${key}"]`);
  const getObjectFromElement = findElement && findElement['0'];
  const defineObject = getObjectFromElement && getObjectFromElement.children[0] as any;
  return {
    exist: Boolean(findElement),
    value: (defineObject && defineObject.data) ?? defaultValue,
  };
};

export const getObjectFromStorageXMLForPageProperties = (pageProperties: cheerio.Element, content: Content): any => {
  const $storageContent = loadStorageContentToXML(content);
  const dataLocalId = pageProperties.attribs['data-local-id'];
  const storageXML = $storageContent(`ac\\:structured-macro[ac\\:local-id="${dataLocalId}"]`);
  return storageXML;
};

export const getAttribiutesFromChildren = (
  storageXML: cheerio.Cheerio<cheerio.Element>,
  {
    defaultValueForSlideTransition,
  }: {
    defaultValueForSlideTransition: string
  },
): { options: { [key: string]: string } } => {
  const getValueByKeyOrAssignDefault = (array: any[], compareKey: string, defaultValue: string) =>
    Object.values(array).find(({ key }) => key === compareKey)?.value ?? defaultValue;

  const options = getAttribiutesFromChildrenByType(storageXML) as any;

  return {
    options: {
      slideId: getValueByKeyOrAssignDefault(options, 'slide_id', ''),
      slideType: getValueByKeyOrAssignDefault(options, 'slide_type', 'cover'),
      slideTransition: getValueByKeyOrAssignDefault(options, 'slide_transition', defaultValueForSlideTransition),
      slideFragment: getValueByKeyOrAssignDefault(options, 'slide_fragment', 'no'),
      slideBackgroundAttachment: getValueByKeyOrAssignDefault(options, 'slide_background_attachment', ''),
    },
  };
};

const getAttribiutesFromChildrenByType = (
  storageXML: cheerio.Cheerio<cheerio.Element>,
) => storageXML.children().map((_, element: any) => {
  const dataInput = element.children && element.children[0];
  if (dataInput) {
    const attachmentSlideAttribs = dataInput.attribs;
    const attachmentSlideUrl = attachmentSlideAttribs && attachmentSlideAttribs['ri:filename'];
    return {
      value: attachmentSlideUrl ?? dataInput.data,
      key: dataInput.parent.attribs['ac:name'],
    };
  }
  return undefined;
});
