import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';

export default (config: ConfigService, injectFormatting = true): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addHighlightjs');
    const $ = context.getCheerioBody();
    const version = config.get('version');
    const basePath = config.get('web.basePath');

    $('pre.syntaxhighlighter-pre').each(
      (_index: number, elementCode: cheerio.Element) => {
        $(elementCode).replaceWith(
          `<pre><code>${$(elementCode).html()}</code></pre>`,
        );
      },
    );

    if (injectFormatting) {
      // `<link rel="stylesheet" type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.3.2/styles/default.min.css" />`
      $('head').append(
        // `<link rel="stylesheet" type="text/css" href="${basePath}/highlight/zenburn.min.css?cache=${version}" />`,
        `<link href="${basePath}/highlight/zenburn.min.css?cache=${version}" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'" />`,
      );

      // `<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.3.2/highlight.min.js"></script>`
      // When the DOM content is loaded call the initialization of the Hightlight library
      $('body').append(
        `<script defer src="${basePath}/highlight/highlight.min.js?cache=${version}"></script>
       <script type="module">
         document.addEventListener('DOMContentLoaded', function () {hljs.initHighlightingOnLoad();})
       </script>`,
      );
    }

    context.getPerfMeasure('addHighlightjs');
  };
};
