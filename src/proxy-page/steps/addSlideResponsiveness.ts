import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addSlideResponsiveness');
  const $ = context.getCheerioBody();
  $('body')
    .find('script')
    .last()
    .attr('defer', 'true')
    .append(
    `
    function handleVerticalSlide(slide) {
        const screenHeight = window.innerHeight;
        setTimeout(function () {
          let currentSlide = slide.currentSlide;
          const slideHeight = (currentSlide.scrollHeight)*0.85;
          const parentSlide = Reveal.getSlide(slide.indexh);
          if(parentSlide.classList.contains('stack')){
            if (slideHeight > screenHeight){
              parentSlide.style.overflowY ='auto';
            }
            else{
              parentSlide.style.overflowY ='hidden';
            }
          }
        }, 1);
      }
      Reveal.addEventListener('slidechanged', function (event) {
        handleVerticalSlide(event);
      });
      Reveal.addEventListener('ready', function (event) {
        handleVerticalSlide(event);
      });
    `,
  );
  context.getPerfMeasure('addSlideResponsiveness');
};
