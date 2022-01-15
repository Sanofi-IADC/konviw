import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addlibrariesJS');
    const $ = context.getCheerioBody();

    // Add JavaScript for Highlight.js (https://highlightjs.org/)
    $('body').append(
      `<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.4.0/highlight.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`,
      `<script type="module">
         document.addEventListener('DOMContentLoaded', (event) => {hljs.highlightAll()})
       </script>`,
    );

    context.getPerfMeasure('addlibrariesJS');
  };
};
