import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addMessageBus');
    const $ = context.getCheerioBody();

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

    $('body').append(
      `<script type="module">
        let height;
        const sendHeightMsg = () => {
          if (height !== document.getElementById('Content').offsetHeight) {
            height = document.getElementById('Content').offsetHeight;
            window.parent.postMessage({
              frameHeight: height
            }, '*');
          }
        }
        const sendMetadataMsg = () => {
          window.parent.postMessage({
            iframeUrl: window.location.href,
            spaceKey: "${context.getSpaceKey().toLowerCase()}",
            pageId: "${context.getPageId()}",
            title: "${context.getTitle()}",
            excerpt: "${context.getExcerpt()}"
          }, '*');
        }
        window.onload = () => {
          sendMetadataMsg();
          sendHeightMsg();
        }
        window.onresize = () => sendHeightMsg();
      </script>`,
    );

    context.getPerfMeasure('addMessageBus');
  };
};
