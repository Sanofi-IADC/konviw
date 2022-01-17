import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addSlidesCSS');
    const $ = context.getCheerioBody();
    const version = config.get('version');
    const basePath = config.get('web.basePath');
    const style = context.getStyle();

    // Let's add the JS library for reveal.js and required CSS styles
    $('head').append(
      // Standard load of stylesheets prioritary for redering the first page
      `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.2.1/reset.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />`,
      `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.2.1/reveal.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />`,
      `<link rel="stylesheet" href="${basePath}/css/slides.css?cache=${version}">`,
      `<link rel="stylesheet" href="${basePath}/reveal/theme/${style}.css?cache=${version}" id="theme">`,
      // Modern deferred load of stylesheets that are not critical for the first page render
      `<link href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.2.1/plugin/highlight/zenburn.min.css" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'" crossorigin="anonymous" referrerpolicy="no-referrer" />`,
    );

    context.getPerfMeasure('addSlidesCSS');
  };
};
