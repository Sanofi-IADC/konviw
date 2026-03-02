import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixExpander');
  const $ = context.getCheerioBody();

  // When the DOM content is loaded call the initialization of the Zooming library
  $('body').append(
    `<script type="module">
      const coll = document.getElementsByClassName("expand-control");
      for (let i = 0; i < coll.length; i++) {
        let imageLoadListeners = [];

        coll[i].addEventListener("click", function() {
          this.classList.toggle("active");

          const content = this.nextElementSibling;

          const syncMaxHeight = () => {
            content.style.maxHeight = content.scrollHeight + 'px';
          };

          const removeListeners = () => {
            imageLoadListeners.forEach(({ image, handlers }) => {
              image.removeEventListener('load', handlers.load);
              image.removeEventListener('error', handlers.error);
            });
            imageLoadListeners = [];
          };

          if (content.style.maxHeight && content.style.maxHeight !== '0px') {
            content.style.maxHeight = null;
            removeListeners();
          } else {
            syncMaxHeight();

            const images = content.querySelectorAll('img.confluence-embedded-image');
            const pendingImages = Array.from(images).filter((img) => !img.complete);

            pendingImages.forEach((image) => {
              const handlers = { load: syncMaxHeight, error: syncMaxHeight };
              image.addEventListener('load', handlers.load);
              image.addEventListener('error', handlers.error);
              imageLoadListeners.push({ image, handlers });
            });
          }
        });
      }
    </script>`,
  );

  context.getPerfMeasure('fixExpander');
};
