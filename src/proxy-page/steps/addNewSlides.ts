import * as cheerio from 'cheerio';
import { Content } from '../../confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { getAttribiutesFromChildren, getObjectFromStorageXMLForPageProperties } from '../utils/macroSlide';

export default (content: Content): Step => (context: ContextService): void => {
  context.setPerfMark('addNewSlides');

  const $ = context.getCheerioBody();

  let sectionsHtml = '';
  // Div with class conf-macro and property slide (Confluence macro "properties") is framing the sections for each slide
  $(".conf-macro[data-macro-name='slide']").each(
    (_index: number, pageProperties: cheerio.Element) => {
      const storageXML = getObjectFromStorageXMLForPageProperties(pageProperties, content);
      const { options, attachment } = getAttribiutesFromChildren(storageXML);
      const [slideType,, slideTransition] = options;
      const slideAttachment = (attachment && attachment['0']) ?? '';
      // we will generate vertical slides if there are 'hr' tags
      const verticalSlides = ($(pageProperties).html() as string).split('<hr>').length > 1;
      const sections = ($(pageProperties).html() as string)
        .split('<hr>')
        .map((body) => cheerio.load(body));
        // Iterate thru the sections split by the 'hr' horizontal lines
        // only one if no split done
      sectionsHtml += verticalSlides ? '<section>' : '';
      sections.forEach((section: cheerio.CheerioAPI) => {
        sectionsHtml += setDynamicStyling(section, slideType, slideTransition, slideAttachment);
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
  slideTransition: string,
  slideAttachment: string,
): string =>
  `<section
    data-state="${slideType}"
    data-transition="${slideTransition}"
    data-background-image="${slideAttachment}"
  >
    ${section('body').html()}
  </section>`;
