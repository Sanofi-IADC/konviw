import { ConfigService } from '@nestjs/config';
import Config from 'src/config/config';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addSlides');
    const $ = context.getCheerioBody();
    const basePath = config.get<Config>('web.basePath');

    // Handle the source code block to be syntax highlighted by highlight.js (auto language detection by default)
    $('pre.syntaxhighlighter-pre').each(
      (_index: number, codeBlock: CheerioElement) => {
        $(codeBlock).replaceWith(
          `<pre><code>${$(codeBlock).html()}</code></pre>`,
        );
      },
    );
    let sections = '';
    // Div with class plugin-tabmeta-details (Confluence macro "properties") is framing the sections for each slide
    $(".plugin-tabmeta-details[data-macro-name='details']").each(
      (_index: number, pageProperties: CheerioElement) => {
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

    const theme = context.getTheme();

    // Let's add the JS library for reveal.js and required CSS styles
    $('head').append(
      `<link rel="stylesheet" href="${basePath}/reveal/reset.css">
      <link rel="stylesheet" href="${basePath}/reveal/reveal.css">
      <link rel="stylesheet" href="${basePath}/reveal/theme/${theme}.css" id="theme">
      <link rel="stylesheet" href="${basePath}/highlight/zenburn.min.css">
      <script src="${basePath}/reveal/reveal.js"></script>`,
    );

    const newHtmlBody = `<div id="Content" class="reveal"><div class="slides">${sections}</div></div>`;
    $('#Content').replaceWith(newHtmlBody);

    // When the DOM content is loaded call the initialization of Reveal (https://revealjs.com/)
    $('#Content').append(
      `<script src="${basePath}/reveal/plugin/zoom/zoom.js"></script>
      <script src="${basePath}/reveal/plugin/highlight/highlight.js"></script>
      <script>
        document.addEventListener('DOMContentLoaded', function () {
          Reveal.initialize({ 
            hash: true,
            center: false,
            plugins: [ RevealZoom, RevealHighlight],
            backgroundTransition: 'slide',
            slideNumber: true,
            disableLayout: false,
            margin: 0.1,
          });
        })
      </script>`,
    );

    context.getPerfMeasure('addSlides');
  };
};
