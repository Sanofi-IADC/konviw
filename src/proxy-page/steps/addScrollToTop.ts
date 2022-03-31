import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addScrollToTop');
    const $ = context.getCheerioBody();

    $('#Content').append(
      `<div class="back-to-top-wrapper">
        <a href="#" class="back-to-top-link" aria-label="Scroll to Top"></a>
      </div>`,
    );
    $('body').append(`
      <script>
      window.addEventListener('scroll', () => {
        const scrolls = window.scrollY;
        const backToTopWrapper = document.querySelector('.back-to-top-wrapper');
        const { classList } = backToTopWrapper;
        const className = 'visible';
        (scrolls > 0) 
          ? classList.add(className)
          : classList.remove(className)
        ;
      });
      </script>`
    );
    context.getPerfMeasure('addScrollToTop');
  };
};
