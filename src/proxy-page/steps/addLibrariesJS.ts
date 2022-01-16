import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addlibrariesJS');
    const $ = context.getCheerioBody();

    // Add library to display code with syntax highlights
    // https://highlightjs.org/
    $('body').append(
      `<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.4.0/highlight.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`,
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
        `<script src="https://cdnjs.cloudflare.com/ajax/libs/zooming/2.1.1/zooming.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`,
        `<script type="module">
        document.addEventListener('DOMContentLoaded', (event) => {
          new Zooming({}).listen('.drawio-zoomable');
          new Zooming({}).listen('.confluence-embedded-image');
        })
         </script>`,
      );
    }

    context.getPerfMeasure('addlibrariesJS');
  };
};
