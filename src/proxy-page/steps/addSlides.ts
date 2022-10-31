import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addSlides');
  const $ = context.getCheerioBody();

  // Handle the source code block to be syntax highlighted by highlight.js (auto language detection by default)
  $('pre.syntaxhighlighter-pre').each(
    (_index: number, codeBlock: cheerio.Element) => {
      $(codeBlock).replaceWith(
        `<pre><code>${$(codeBlock).html()}</code></pre>`,
      );
    },
  );
  let sectionsHtml = '';
  // Div with class plugin-tabmeta-details (Confluence macro "properties") is framing the sections for each slide
  $(".plugin-tabmeta-details[data-macro-name='details']").each(
    (_index: number, pageProperties: cheerio.Element) => {
      // we will generate vertical slides if there are 'hr' tags
      const verticalSlides = ($(pageProperties).html() as string).split('<hr>').length > 1;
      const sections = ($(pageProperties).html() as string)
        .split('<hr>')
        .map((body) => cheerio.load(body));
        // Iterate thru the sections split by the 'hr' horizontal lines
        // only one if no split done
      sectionsHtml += verticalSlides ? '<section>' : '';
      sections.forEach((section: cheerio.CheerioAPI) => {
        const className = section('body').children().first().attr('class') ?? '';
        // Based on the 'tag' name of the first element we will design the slide format
        switch (section('body').first().children().get(0)?.tagName) {
          case 'h1':
            sectionsHtml += getSlideCover(section);
            break;
          case 'h3':
            sectionsHtml += getSlideBubble(section);
            break;
          case 'span':
            // If first element is an image so let's fill the full background
            if (className.match(/confluence-embedded-file-wrapper/g)) {
              sectionsHtml += getSlideImageBackground(section);
            }
            break;
          default:
            // otherwise plain standard slide
            sectionsHtml += getSlideDefault(section);
        }
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

  context.getPerfMeasure('addSlides');
};

// Cover slide
const getSlideCover = (section: cheerio.CheerioAPI): string => `<section data-state="cover">${section('body').html()}</section>`;

// Special slide with title as a bubble
const getSlideBubble = (section: cheerio.CheerioAPI): string => `<section data-state="bubble">${section('body').html()}</section>`;

// Default slide style
const getSlideDefault = (section: cheerio.CheerioAPI): string => `<section>${section('body').html()}</section>`;

// Slide with a background image
const getSlideImageBackground = (section: cheerio.CheerioAPI): string => {
  // gets the image tag element: section('body').children().first().
  // gets the image 'src' attr : section('body').children().first().children().first().attr('src')
  const srcImage = section('body').children().first().children()
    .first()
    .attr('src') || '';
  // remove the image as we will place it already as background
  section('body').children().first().remove();
  return `<section data-background-image=${srcImage}>
  ${section('body').html()}</section>`;
};
