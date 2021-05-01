import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addReadingProgressBar');
    const $ = context.getCheerioBody();

    // Attach a new div empty component fixed at the begining of the document
    // to increase dynamycally the width as the page scrolls down
    $('#Content').prepend(
      `<div class="reading-progress" id="reading-progress"></div>`,
    );

    // Calculation of the dimensions of the windows and scroll position
    // to translate into the width to be injected in the div component
    // defined earlier.
    // Then addition of a new event to trigger the calculation while scrolls
    $('body').append(
      `<script>
        const readingProgressId = document.getElementById('reading-progress');
        const setProgress = () => {
          const maxHeight = document.body.scrollHeight;
          const sizeHeight = window.innerHeight;
          const scrolls = window.scrollY;
          const percentage = (scrolls / (maxHeight - sizeHeight)) * 100;
          readingProgressId.style.width = percentage + '%';
        }
        window.addEventListener('scroll', setProgress);
        setProgress();
      </script>`,
    );

    context.getPerfMeasure('addReadingProgressBar');
  };
};
