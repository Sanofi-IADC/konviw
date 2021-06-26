import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixRoadmap');
    const $ = context.getCheerioBody();
    const basePath = config.get('web.basePath');

    // Add link to pages when defined for a bar
    $('div.roadmap-macro-view .bar-title').each(
      (_index: number, titleElement: cheerio.TagElement) => {
        const thisTitle = $(titleElement).data();
        if (thisTitle.roadmapBar.pageLink.id) {
          $(titleElement)
            .children()
            .first()
            .replaceWith(
              `<div class="bar-title-page">
              <a href="${basePath}/wiki/spaces/${thisTitle.roadmapBar.pageLink.spaceKey}/pages/${thisTitle.roadmapBar.pageLink.id}">
              ${thisTitle.roadmapBar.title}
              </a>
            </div>`,
            );
        }
      },
    );
    context.getPerfMeasure('fixRoadmap');
  };
};
