import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { Content } from '../../confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { getAttributesFromChildren, getObjectFromStorageXMLForPageProperties } from '../utils/macroSlide';

export default (config: ConfigService, content: Content): Step => (context: ContextService): void => {
  context.setPerfMark('addNewSlides');

  const commonUnexpectedExpression = [
    '[data-macro-name="panel"]',
    '[data-macro-name="info"]',
    '[data-macro-name="tip"]',
    '[data-macro-name="note"]',
    '[data-macro-name="warning"]',
  ];

  const unexpectedExpressionForParagraphs = [
    'li',
    'ul',
    'ol',
    'blockquote',
    ...commonUnexpectedExpression,
  ];

  const unexpectedExpressionForSpan = [
    ...commonUnexpectedExpression,
  ];

  const webBasePath = config.get('web.absoluteBasePath');

  const attachmentResource = `${webBasePath}/wiki/download/attachments/${context.getPageId()}/`;

  const $ = context.getCheerioBody();

  const convertSlideFragmentValueToBoolean = (value: string) => value === 'yes';

  const callbackToAssignFragmentClass = (element: cheerio.Element, possibleNested: boolean, forceAssign: boolean) => {
    if (forceAssign) {
      $(element).addClass('fragment');
    }
    const existRealChildrenWithText = element.children.some((value: cheerio.Node & { data: string; children: { data: string }[] }) => {
      if (possibleNested) {
        return value.data && value.data.trim().length > 0;
      }
      return true;
    });
    if (existRealChildrenWithText) {
      const htmlElemenet = $(element);
      const finalElement = (htmlElemenet && htmlElemenet['0']) ?? htmlElemenet;
      $(finalElement).addClass('fragment');
    }
  };

  const searchByTagToAssignFragment = (
    expression: string,
    possibleNested: boolean,
    slideProperties: cheerio.Element,
    unexpectedExpressionForNestedElements: string[],
    forceAssign: boolean,
  ) => {
    $(slideProperties).find(expression).each((_: number, element: cheerio.Element) => {
      if (possibleNested) {
        const isCorrectConditionalToAssignFragment = unexpectedExpressionForNestedElements.some(
          (unexpectedExpression) => $(element).parents(unexpectedExpression)?.length > 0,
        );
        if (!isCorrectConditionalToAssignFragment) {
          callbackToAssignFragmentClass(element, possibleNested, forceAssign);
        }
      } else {
        callbackToAssignFragmentClass(element, possibleNested, forceAssign);
      }
    });
  };

  // Handle the source code block to be syntax highlighted by highlight.js (auto language detection by default)
  $('pre.syntaxhighlighter-pre').each(
    (_index: number, codeBlock: cheerio.Element) => {
      $(codeBlock).replaceWith(
        `<pre><code>${$(codeBlock).html()}</code></pre>`,
      );
    },
  );

  let sectionsHtml = '';
  // Div with class conf-macro and property slide (Confluence macro "slide") is framing the sections for each slide
  $(".conf-macro[data-macro-name='slide']").each(
    (_index: number, slideProperties: cheerio.Element) => {
      const storageXML = getObjectFromStorageXMLForPageProperties(slideProperties, content);
      const { options } = getAttributesFromChildren(storageXML);
      const {
        slideBackgroundAttachment, slideType, slideTransition, slideParagraphAnimation,
      } = options;

      // we will generate vertical slides if there are 'hr' tags
      const verticalSlides = ($(slideProperties).html() as string).split('<hr>').length > 1;

      // Add fragment class for each paragraph to apply fade-in animation
      if (convertSlideFragmentValueToBoolean(slideParagraphAnimation)) {
        searchByTagToAssignFragment('p', true, slideProperties, unexpectedExpressionForParagraphs, false);
        searchByTagToAssignFragment('li', false, slideProperties, [], false);
        searchByTagToAssignFragment('pre', false, slideProperties, [], false);
        searchByTagToAssignFragment('span', true, slideProperties, unexpectedExpressionForSpan, false);
        searchByTagToAssignFragment('img', false, slideProperties, [], true);
        searchByTagToAssignFragment('iframe', false, slideProperties, [], true);
        searchByTagToAssignFragment('[data-macro-name="panel"]', false, slideProperties, [], false);
        searchByTagToAssignFragment('[data-macro-name="info"]', false, slideProperties, [], false);
        searchByTagToAssignFragment('[data-macro-name="tip"]', false, slideProperties, [], false);
        searchByTagToAssignFragment('[data-macro-name="note"]', false, slideProperties, [], false);
        searchByTagToAssignFragment('[data-macro-name="warning"]', false, slideProperties, [], false);
        searchByTagToAssignFragment('blockquote', false, slideProperties, [], false);
      }
      const sections = ($(slideProperties).html() as string)
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
  const dataTransition = slideTransition === '' ? '' : `data-transition="${slideTransition}"`;
  if (slideBackgroundAttachment && slideBackgroundAttachment.length > 0) {
    const attachment = slideBackgroundAttachment
      ? `${attachmentResource}/${slideBackgroundAttachment}`
      : '';
    if (!isImage(slideBackgroundAttachment)) {
      return `<section
        data-state="${slideType}"
        ${dataTransition}
        data-background-video="${attachment}"
        data-background-video-loop
        data-background-video-muted
      >
        ${section('body').html()}
      </section>`;
    }
    return `<section
        data-state="${slideType}"
        ${dataTransition}
        data-background-image="${attachment}"
      >
        ${section('body').html()}
      </section>`;
  }
  return `<section
      data-state="${slideType}"
      ${dataTransition}
    >
      ${section('body').html()}
    </section>`;
};
