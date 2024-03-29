import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addMessageLastSlide');
  const $ = context.getCheerioBody();
  const lastSlide = $('#Content').first();
  const message = '<section class="message"><a href="https://github.com/Sanofi-IADC/konviw">'
    + 'Made with ❤️ Confluence and konviw</a></div>';
  lastSlide.append(message);
  $('body').find('script').last().after(
    `<script defer>
      function updateMessageVisibility() {
        const lastSlideIndex = Reveal.getHorizontalSlides().length - 1;
        const isLastSlide = Reveal.getIndices().h === lastSlideIndex;
        if (isLastSlide){
          document.querySelector('.message').style.display = 'block';
        } else{
          document.querySelector('.message').style.display = 'none';
        }
      }
      Reveal.initialize();
      Reveal.getRevealElement().addEventListener('slidechanged', updateMessageVisibility);          
      updateMessageVisibility();        
    </script>`,
  );
  context.getPerfMeasure('addMessageLastSlide');
};
