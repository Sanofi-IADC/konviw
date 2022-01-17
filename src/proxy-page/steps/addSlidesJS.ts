import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (transition: string): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addSlidesJS');
    const $ = context.getCheerioBody();

    // Add libraries for Reveal slides
    // https://revealjs.com/
    // When the DOM content is loaded call the initialization of Reveal
    $('body').append(
      `<script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.2.1/reveal.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`,
      `<script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.2.1/plugin/highlight/highlight.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`,
      `<script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.2.1/plugin/zoom/zoom.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`,
      `<script defer>
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
          margin: 0.1,
          width: "100%",
          height: "100%",
          minScale: 1,
          maxScale: 1
        });
      })
    </script>`,
    );

    context.getPerfMeasure('addSlidesJS');
  };
};
