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
              coll[i].addEventListener("click", function() {
                this.classList.toggle("active");
                var content = this.nextElementSibling;
                if (content.style.maxHeight){
                  content.style.maxHeight = null;
                } else {
                  content.style.maxHeight = content.scrollHeight + "px";
                } 
              });
            }
      </script>`,
  );

  context.getPerfMeasure('fixExpander');
};
