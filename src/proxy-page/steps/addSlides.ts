import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addSlides');
    const $ = context.getCheerioBody();
    const basePath = config.get('web.basePath');
    const version = config.get('version');

    // Handle the source code block to be syntax highlighted by highlight.js (auto language detection by default)
    $('pre.syntaxhighlighter-pre').each(
      (_index: number, codeBlock: cheerio.TagElement) => {
        $(codeBlock).replaceWith(
          `<pre><code>${$(codeBlock).html()}</code></pre>`,
        );
      },
    );
    let sections = '';
    // Div with class plugin-tabmeta-details (Confluence macro "properties") is framing the sections for each slide
    $(".plugin-tabmeta-details[data-macro-name='details']").each(
      (_index: number, pageProperties: cheerio.TagElement) => {
        const thisBlock = $(pageProperties).children().first().attr('class');
        if (thisBlock) {
          // First element is an image so let's fill the full background
          if (thisBlock.match(/confluence-embedded-file-wrapper/g)) {
            const srcImage =
              $(pageProperties).children().first().children().attr('src') || '';
            $(pageProperties).children().first().remove();
            sections += `<section data-background-image=${srcImage}>
                  ${$(pageProperties).html()}</section>`;
          }
        } else if (
          // if heading 1 let's make it a cover
          $(pageProperties).children().first().get(0).tagName === 'h1'
        ) {
          sections += `<section data-state="cover">${$(
            pageProperties,
          ).html()}</section>`;
        } else if (
          // heading 3 will be a nice blue bubble to wrap the title
          $(pageProperties).children().first().get(0).tagName === 'h3'
        ) {
          sections += `<section data-state="bubble">${$(
            pageProperties,
          ).html()}</section>`;
        } else {
          // otherwise plain standard slide
          sections += `<section>${$(pageProperties).html()}</section>`;
        }
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

    const newHtmlBody = `<div id="Content" class="reveal"><div class="slides">${sections}</div></div>`;
    $('#Content').replaceWith(newHtmlBody);

    // When the DOM content is loaded call the initialization of Reveal (https://revealjs.com/)
    $('body').append(
      `<script defer src="${basePath}/reveal/plugin/zoom/zoom.js?cache=${version}"></script>
      <script defer src="${basePath}/reveal/plugin/highlight/highlight.js?cache=${version}"></script>
      <script defer>
        document.addEventListener('DOMContentLoaded', function () {
          Reveal.initialize({
            hash: true,
            center: false,
            plugins: [ RevealZoom, RevealHighlight],
            backgroundTransition: 'slide',
            slideNumber: true,
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
