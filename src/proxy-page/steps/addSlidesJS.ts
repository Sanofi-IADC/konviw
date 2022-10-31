import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (config: ConfigService): Step => (context: ContextService): void => {
  context.setPerfMark('addSlidesJS');
  const $ = context.getCheerioBody();
  const basePath = config.get('web.basePath');

  // Add libraries for Reveal slides
  // https://revealjs.com/
  // When the DOM content is loaded call the initialization of Reveal
  $('body').append(
    `<script
      src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.2.1/reveal.min.js"
      crossorigin="anonymous"
      referrerpolicy="no-referrer">
    </script>`,
    `<script
      src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.2.1/plugin/highlight/highlight.min.js"
      crossorigin="anonymous"
      referrerpolicy="no-referrer">
    </script>`,
    `<script
      src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.2.1/plugin/zoom/zoom.min.js"
      crossorigin="anonymous"
      referrerpolicy="no-referrer">
    </script>`,
    `<script
      src="${basePath}/reveal/plugin/menu.2.1.0/menu.js"
      crossorigin="anonymous"
      referrerpolicy="no-referrer">
    </script>`,
    `<script defer>
      document.addEventListener('DOMContentLoaded', function () {
        Reveal.initialize({
          hash: true,
          history: true,
          center: false,
          plugins: [ RevealZoom, RevealHighlight, RevealMenu],
          menu: { // Menu works best with font-awesome installed
            openButton: true,
            openSlideNumber: true,
            keyboard: true,
            sticky: false,
            themes:
            [
              { name: "Digital", theme: "${basePath}/reveal/theme/digital.css"},
              { name: "IADC", theme: "${basePath}/reveal/theme/iadc.css"},
              { name: "Konviw", theme: "${basePath}/reveal/theme/konviw.css"}
            ],
            transitions: true,
            numbers: 'c',
            markers: true,
            hideMissingTitles: false,
            loadIcons: true,
          },
          transition: 'fade',
          backgroundTransition: 'fade',
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
