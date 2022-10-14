import * as cheerio from 'cheerio';
import { Content } from 'src/confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (content?: Content): Step => (context: ContextService): void => {
  context.setPerfMark('addNewSlides');

  const $ = context.getCheerioBody();
  const $storageContent = cheerio.load(content.body.storage.value ?? '', { xmlMode: true });

  const getObjectFromStorageXMLForPageProperties = (pageProperties: cheerio.Element) => {
    const dataLocalId = pageProperties.attribs['data-local-id'];
    const storageXML = $storageContent(`ac\\:structured-macro[ac\\:local-id="${dataLocalId}"]`);
    return storageXML;
  };

  const getAttribiutesFromChildren = (storageXML: cheerio.Cheerio<cheerio.Element>) => {
    return storageXML.children().map((_, element: any) => element.children[0]?.data);
  };

  // Div with class conf-macro and property slideCover (Confluence macro "properties") is framing the full deck of slides
  $(".conf-macro[data-macro-name='slideCover']").each(
    (_index: number, pageProperties: cheerio.Element) => {
      const storageXML = getObjectFromStorageXMLForPageProperties(pageProperties);
      const [slideTheme] = getAttribiutesFromChildren(storageXML);
      console.log(slideTheme);
  });

  let sectionsHtml = '';
  // Div with class conf-macro and property slide (Confluence macro "properties") is framing the sections for each slide
  $(".conf-macro[data-macro-name='slide']").each(
    (_index: number, pageProperties: cheerio.Element) => {
      const storageXML = getObjectFromStorageXMLForPageProperties(pageProperties);
      const [slideType, slideId, slideTransition] = getAttribiutesFromChildren(storageXML);
      console.log(slideType, slideId, slideTransition);
      // we will generate vertical slides if there are 'hr' tags
      const verticalSlides = ($(pageProperties).html() as string).split('<hr>').length > 1;
      const sections = ($(pageProperties).html() as string)
        .split('<hr>')
        .map((body) => cheerio.load(body));
        // Iterate thru the sections split by the 'hr' horizontal lines
        // only one if no split done
        sectionsHtml += verticalSlides ? '<section>' : '';
      sections.forEach((section: cheerio.CheerioAPI) => {
        sectionsHtml += setDynamicStyling(section, slideType, slideTransition);
      });

      sectionsHtml += verticalSlides ? '</section>' : '';
    },
  );

  const newHtmlBody = '<div id="Content">'
      + '<section id="slides-logo"></section>'
      + '<div class="reveal slide">'
      + `<div class="slides">${sectionsHtml}</div>`
      + '</div></div>';
  $('#Content').replaceWith(newHtmlBody);

  context.getPerfMeasure('addNewSlides');
};

// Generic slide style
export const setDynamicStyling = (
    section: cheerio.CheerioAPI,
    slideType: string,
    slideTransition: string): string =>
    `<section data-state="${slideType}" data-transition="${slideTransition}">${section('body').html()}</section>`;