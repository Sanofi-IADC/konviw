import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addlibrariesCSS');
    const $ = context.getCheerioBody();
    const version = config.get('version');

    // Add styles for Highlight.js (https://highlightjs.org/)
    // TODO: make configurable version and theme
    $('head').append(
      `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.4.0/styles/github-dark-dimmed.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />`,
      // `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.4.0/styles/github.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />`,
    );

    context.getPerfMeasure('addlibrariesCSS');
  };
};
