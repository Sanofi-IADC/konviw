import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import Config from '../../config/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addHighlightjs');
    const $ = context.getCheerioBody();
    const version = config.get<Config>('version');
    const basePath = config.get<Config>('web.basePath');

    $('pre.syntaxhighlighter-pre').each(
      (_index: number, macro: CheerioElement) => {
        $(macro).replaceWith(`<pre><code>${$(macro).html()}</code></pre>`);
      },
    );

    // `<link rel="stylesheet" type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.3.2/styles/default.min.css" />`
    $('head').append(
      `<link rel="stylesheet" type="text/css" href="${basePath}/highlight/zenburn.min.css?nocache=${version}" />`,
    );

    // `<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.3.2/highlight.min.js"></script>`
    // When the DOM content is loaded call the initialization of the Hightlight library
    $('body').append(
      `<script defer src="${basePath}/highlight/highlight.min.js?nocache=${version}"></script>
       <script type="module">
         document.addEventListener('DOMContentLoaded', function () {hljs.initHighlightingOnLoad();})
       </script>`,
    );

    context.getPerfMeasure('addHighlightjs');
  };
};
