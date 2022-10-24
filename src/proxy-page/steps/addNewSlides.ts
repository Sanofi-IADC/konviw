import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { Content } from '../../confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import {
  getAttribiutesFromChildren, getMacroSlideSettingsPropertyValueByKey, getObjectFromStorageXMLForPageProperties, loadStorageContentToXML,
} from '../utils/macroSlide';

export default (config: ConfigService, content: Content): Step => (context: ContextService): void => {
  context.setPerfMark('addNewSlides');

  const webBasePath = config.get('web.absoluteBasePath');

  const attachmentResource = `${webBasePath}/wiki/download/attachments/${context.getPageId()}/`;

  const $ = context.getCheerioBody();

  const storageContentXML = loadStorageContentToXML(content);

  const macroSettingsSlideTransition = getMacroSlideSettingsPropertyValueByKey(storageContentXML, 'slide_settings_transition', 'slide');

  const convertSlideFragmentValueToBoolean = (value: string) => value === 'yes';

  // Handle the source code block to be syntax highlighted by highlight.js (auto language detection by default)
  $('pre.syntaxhighlighter-pre').each(
    (_index: number, codeBlock: cheerio.Element) => {
      $(codeBlock).replaceWith(
        `<pre><code>${$(codeBlock).html()}</code></pre>`,
      );
    },
  );

  let sectionsHtml = '';
  // Div with class conf-macro and property slide (Confluence macro "properties") is framing the sections for each slide
  $(".conf-macro[data-macro-name='slide']").each(
    (_index: number, pageProperties: cheerio.Element) => {
      const storageXML = getObjectFromStorageXMLForPageProperties(pageProperties, content);
      const { options } = getAttribiutesFromChildren(storageXML, {
        defaultValueForSlideTransition: macroSettingsSlideTransition.value,
      });
      const {
        slideBackgroundAttachment, slideType, slideTransition, slideParagraphAnimation,
      } = options;
      // we will generate vertical slides if there are 'hr' tags
      const verticalSlides = ($(pageProperties).html() as string).split('<hr>').length > 1;
      // Add fragment class for each paragraph to apply fade-in animation
      if (convertSlideFragmentValueToBoolean(slideParagraphAnimation)) {
        $(pageProperties).find('p').each((_: number, paragraphElement: cheerio.Element) => {
          const existRealChildrenWithText = paragraphElement.children.some((value: cheerio.Node & { data: string }) =>
            value.data && value.data.trim().length > 0);
          if (existRealChildrenWithText) {
            $(paragraphElement).addClass('fragment');
          }
        });
      }
      const sections = ($(pageProperties).html() as string)
        .split('<hr>')
        .map((body) => cheerio.load(body));
        // Iterate thru the sections split by the 'hr' horizontal lines
        // only one if no split done
      sectionsHtml += verticalSlides ? '<section>' : '';
      sections.forEach((section: cheerio.CheerioAPI) => {
        sectionsHtml += setDynamicStyling(
          section,
          slideType,
          slideTransition,
          attachmentResource,
          slideBackgroundAttachment,
        );
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

// Check if attachment is image extension
const isImage = (url: string): boolean => /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url);

// Generic slide style
export const setDynamicStyling = (
  section: cheerio.CheerioAPI,
  slideType: string,
  slideTransition: string,
  attachmentResource: string,
  slideBackgroundAttachment: string,
): string => {
  if (slideBackgroundAttachment && slideBackgroundAttachment.length > 0) {
    const attachment = slideBackgroundAttachment
      ? `${attachmentResource}/${slideBackgroundAttachment}`
      : '';
    if (!isImage(slideBackgroundAttachment)) {
      return `<section
        data-state="${slideType}"
        data-transition="${slideTransition}"
        data-background-video="${attachment}"
        data-background-video-loop
        data-background-video-muted
      >
        ${section('body').html()}
      </section>`;
    }
    return `<section
        data-state="${slideType}"
        data-transition="${slideTransition}"
        data-background-image="${attachment}"
      >
        ${section('body').html()}
      </section>`;
  }
  return `<section
      data-state="${slideType}"
      data-transition="${slideTransition}"
    >
      ${section('body').html()}
    </section>`;
};
