import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addlibrariesCSS');
    const $ = context.getCheerioBody();
    const theme = context.getTheme();

    // Add styles for Highlight.js (https://highlightjs.org/)
    if (theme === 'dark') {
      $('head').append(
        `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.4.0/styles/github-dark-dimmed.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />`,
      );
    } else {
      $('head').append(
        `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.4.0/styles/github.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />`,
      );
    }

    context.getPerfMeasure('addlibrariesCSS');
  };
};
