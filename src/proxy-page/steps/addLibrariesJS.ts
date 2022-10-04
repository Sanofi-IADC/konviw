import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addlibrariesJS');
  const $ = context.getCheerioBody();

  // Add library to display code with syntax highlights
  // https://highlightjs.org/
  $('body').append(
    `<script
      src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.4.0/highlight.min.js"
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    ></script>`,
    `<script type="module">
         document.addEventListener('DOMContentLoaded', (event) => {
           hljs.highlightAll();
         })
       </script>`,
  );

  // Add library to include the zooming effect to drawio and images
  // https://github.com/kingdido999/zooming
  if (context.getView() !== 'iframe-resizer') {
    $('body').append(
      `<script
        src="https://cdnjs.cloudflare.com/ajax/libs/zooming/2.1.1/zooming.min.js"
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
      ></script>`,
      `<script type="module">
        document.addEventListener('DOMContentLoaded', (event) => {
          const getParentZommingElement = (element) => element.closest('.table-wrap');
          const toggleOverflowStyling = (element, value) => {
            if (element) {
              element.style.overflow = value;
            }
          };
          const zooming = new Zooming({
            onBeforeOpen: (target) => toggleOverflowStyling(getParentZommingElement(target), 'visible'),
            onClose: (target) => toggleOverflowStyling(getParentZommingElement(target), 'auto'),
          });
          zooming.listen('.drawio-zoomable');
          zooming.listen('.confluence-embedded-image');
        })
         </script>`,
    );
  }

  // Add library iframe-resizer for both sending messages to the iframe (if any)
  // and auto resizer of the iframe to the content of the konviw page
  // https://github.com/davidjbradshaw/iframe-resizer
  $('body').append(
    `<script 
      src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.2/iframeResizer.contentWindow.js" 
      crossorigin="anonymous" 
      referrerpolicy="no-referrer"
    ></script>
      <script type="module">
        const konviwMessage = {
          konviwFrameUrl: window.location.href,
          konviwSpaceKey: '${context.getSpaceKey()}',
          konviwPageId: '${context.getPageId()}',
          konviwTitle: '${context.getTitle().replace(/'/g, "\\'")}',
          konviwExcerpt: '${context
    .getExcerpt()
    .replace(/\n/g, '')
    .replace(/'/g, "\\'")}',
          konviwCreatedVersion: '${JSON.stringify(
    context.getCreatedVersion(),
  )}',
          konviwLastVersion: '${JSON.stringify(context.getLastVersion())}',
          labels: '${JSON.stringify(context.getLabels())}',
          readTime: '${context.getReadTime()}',
        }
        window.iFrameResizer = {
          onReady: function() {
            if ('parentIFrame' in window) window.parentIFrame.sendMessage(konviwMessage);
          }
        }
      </script>`,
  );

  context.getPerfMeasure('addlibrariesJS');
};
