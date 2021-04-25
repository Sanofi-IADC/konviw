import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import Config from '../../config/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addMessageBus');
    const $ = context.getCheerioBody();
    const version = config.get<Config>('version');
    const basePath = config.get<Config>('web.basePath');

    // Excerpt macro is parsed as a span block with classes 'conf-macro' and 'output-inline'
    // and data-macro-name='excerpt'
    // Unfortunately if the property hidden=true the styled_body will not return the excerpt
    // TODO: Probably this part would be better in a context.SetMetadata dedicated step
    context.setExcerpt('');
    $("span.conf-macro.output-inline[data-macro-name='excerpt']")
      .first()
      .each((_index: number, elementExcerpt: CheerioElement) => {
        const excerptPage = $(elementExcerpt);
        context.setExcerpt(excerptPage.text());
      });

    // TODO: Send and receive messages via iFrameResizer instead of via plain postMessage
    $('body').append(
      `<script type="text/javascript" defer src="${basePath}/iframeResizer/iframeResizer.contentWindow.min.js?cache=${version}"></script>
      <script type="module">
        const konviwMessage = {
          konviwFrameUrl: window.location.href,
          konviwSpaceKey: "${context.getSpaceKey().toLowerCase()}",
          konviwPageId: "${context.getPageId()}",
          konviwTitle: "${context.getTitle()}",
          konviwExcerpt: "${context.getExcerpt()}"
        }
        window.iFrameResizer = {
          onReady: function() {
            if ('parentIFrame' in window) window.parentIFrame.sendMessage(konviwMessage);
          }
        }
        const sendMetadataMsg = () => {
          window.parent.postMessage(konviwMessage, '*');
        }
        window.onload = () => {
          sendMetadataMsg();
        }
      </script>`,
    );

    context.getPerfMeasure('addMessageBus');
  };
};
