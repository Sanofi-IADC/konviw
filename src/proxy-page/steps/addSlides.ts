import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (config: ConfigService, transition: string): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addSlides');
    const $ = context.getCheerioBody();
    const basePath = config.get('web.basePath');
    const version = config.get('version');

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
        const verticalSlides =
          ($(pageProperties).html() as string).split('<hr>').length > 1
            ? true
            : false;
        const sections = ($(pageProperties).html() as string)
          .split('<hr>')
          .map((body) => {
            return cheerio.load(body);
          });
        // Iterate thru the sections split by the 'hr' horizontal lines
        // only one if no split done
        sectionsHtml += verticalSlides ? `<section>` : '';
        sections.forEach((section: cheerio.CheerioAPI) => {
          // Based on the 'tag' name of the first element we will design the slide format
          switch (section('body').first().children().get(0).tagName) {
            case 'h1':
              sectionsHtml += getSlideCover(section);
              break;
            case 'h3':
              sectionsHtml += getSlideBubble(section);
              break;
            case 'span':
              // gets the span tag element : section('body').first().
              const spanClass =
                section('body').children().first().attr('class') ?? '';
              // If first element is an image so let's fill the full background
              if (spanClass.match(/confluence-embedded-file-wrapper/g)) {
                sectionsHtml += getSlideImageBackground(section);
              }
              break;
            default:
              // otherwise plain standard slide
              sectionsHtml += getSlideDefault(section);
          }
        });
        sectionsHtml += verticalSlides ? `</section>` : '';
      },
    );

    const style = context.getStyle();

    // Let's add the JS library for reveal.js and required CSS styles
    $('head').append(
      // Standard load of stylesheets prioritary for redering the first page
      `<link rel="stylesheet" href="${basePath}/reveal/reset.css?cache=${version}">`,
      `<link rel="stylesheet" href="${basePath}/css/slides.css?cache=${version}">`,
      `<link rel="stylesheet" href="${basePath}/reveal/reveal.css?cache=${version}">`,
      `<link rel="stylesheet" href="${basePath}/reveal/theme/${style}.css?cache=${version}" id="theme">`,
      // Modern deferred load of stylesheets that are not critical for the first page render
      `<link href="${basePath}/highlight/zenburn.min.css?cache=${version}" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'" />`,
    );
    $('body').append(
      `<script defer src="${basePath}/reveal/reveal.js?cache=${version}"></script>`,
    );

    const newHtmlBody = `<div id="Content">
    <section id="slides-logo"></section>
    <div class="reveal slide">
      <div class="slides">${sectionsHtml}</div>
    </div></div>`;
    $('#Content').replaceWith(newHtmlBody);

    // When the DOM content is loaded call the initialization of Reveal (https://revealjs.com/)
    $('body').append(
      `<script defer src="${basePath}/reveal/plugin/zoom/zoom.js?cache=${version}"></script>
      <script defer src="${basePath}/reveal/plugin/highlight/highlight.js?cache=${version}"></script>
      <script defer>
        document.addEventListener('DOMContentLoaded', function () {
          Reveal.initialize({
            hash: true,
            history: true,
            center: false,
            plugins: [ RevealZoom, RevealHighlight],
            transition: '${transition}',
            backgroundTransition: '${transition}',
            slideNumber: 'c/t',
            disableLayout: false,
            // This will make the slide responsive
            margin: 0.1,
            width: "100%",
            height: "100%",
            minScale: 1,
            maxScale: 1
          });
        })
      </script>`,
    );

    context.getPerfMeasure('addSlides');
  };
};

// Cover slide
const getSlideCover = (section: cheerio.CheerioAPI): string => {
  return `<section data-state="cover">${section('body').html()}</section>`;
};

// Special slide with title as a bubble
const getSlideBubble = (section: cheerio.CheerioAPI): string => {
  return `<section data-state="bubble">${section('body').html()}</section>`;
};

// Default slide style
const getSlideDefault = (section: cheerio.CheerioAPI): string => {
  return `<section>${section('body').html()}</section>`;
};

// Slide with a background image
const getSlideImageBackground = (section: cheerio.CheerioAPI): string => {
  // gets the image tag element: section('body').children().first().
  // gets the image 'src' attr : section('body').children().first().children().first().attr('src')
  const srcImage =
    section('body').children().first().children().first().attr('src') || '';
  // remove the image as we will place it already as background
  section('body').children().first().remove();
  return `<section data-background-image=${srcImage}>
  ${section('body').html()}</section>`;
};
