import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import * as url from 'url';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixRoadmap');
    const $ = context.getCheerioBody();
    const basePath = config.get('web.absoluteBasePath');

    // Add link to pages when defined for a bar
    $('div.roadmap-macro-view .bar-title').each(
      (_index: number, titleElement: cheerio.Element) => {
        const thisTitle: any = $(titleElement).data();
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

    /* Replace roadmap iframe navigation by an call to an internal page */
    $('[data-macro-id]').each(
      (_index: number, element: cheerio.Element) => {
        const iframe = $(element).children().first();
        const iframeSrc = $(iframe).attr('src');
        if (!iframeSrc) return;
        const searchParams = new URL(iframeSrc).searchParams;
        
        $(element).replaceWith(`
          <div>
          ${
            $(element)
             .html()
             .replace(iframeSrc, `/cpv/wiki/roadmap/${searchParams.get('r')}`)
          }
          </div>`
        );
      }
    );
    context.getPerfMeasure('fixRoadmap');
  };
};
