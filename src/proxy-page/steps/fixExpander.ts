import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixExpander');
  const $ = context.getCheerioBody();

  // When the DOM content is loaded call the initialization of the Zooming library
  $('body').append(
    `<script type="module">
      const coll = document.getElementsByClassName("expand-control");
      let i;
      for (i = 0; i < coll.length; i++) {
        let promiseFinallyState = false;
        coll[i].addEventListener("click", function() {
          this.classList.toggle("active");
          const content = this.nextElementSibling;
          const toggleMaxHeight = (clear = false) =>
            content.style.maxHeight = clear ? null : content.scrollHeight + "px";
          const toggleOpacity = (value) => content.style.opacity = value;
          const togglePromiseFinallyState = () => promiseFinallyState = !promiseFinallyState;
          if (content.style.maxHeight) {
            toggleMaxHeight(true);
          } else {
            const imagesCollection = content.querySelectorAll('img');
            if (imagesCollection && imagesCollection.length > 0 && !promiseFinallyState) {
              toggleOpacity('0');
              toggleMaxHeight();
              const loadImageStatusFn = (image) => new Promise(
                (res) => image.addEventListener('load', () => res())
              );
              Promise.all([...imagesCollection].map(loadImageStatusFn)).finally(() => {
                toggleMaxHeight();
                toggleOpacity('1');
                togglePromiseFinallyState();
              });
            } else {
              toggleMaxHeight();
            }
          }
        });
      }
    </script>`,
  );

  context.getPerfMeasure('fixExpander');
};