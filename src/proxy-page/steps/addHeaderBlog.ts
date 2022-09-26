import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfluenceService } from '../../confluence/confluence.service';
import { ConfigService } from '@nestjs/config';
// import * as cheerio from 'cheerio';

export default (config: ConfigService, confluence: ConfluenceService): Step => {
  return async (context: ContextService): Promise<void> => {
    context.setPerfMark('addHeaderBlog');
    const $ = context.getCheerioBody();
    // const webBasePath = config.get('web.absoluteBasePath');

    const blogImgSrc = context.getHeaderImage(); // default blog header is the headerImage

    const blogExcerptString = '';
    let blogHeaderHTML = '',
      blogExcerptHTML = '';

    if (blogImgSrc) {
      blogHeaderHTML = `
        <div class="blog--header"
          style="background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
          url('${blogImgSrc}');">
          <div class="blog--box">
            <div class="blog--title">
              ${context.getTitle()}
            </div>
            <div>
              <img class="userLogo logo" src="${context.getAvatar()}">
              <div class="blog--vCard">
                <div class="blog--when">${context.getFriendlyWhen()} • ${context.getReadTime()} min read</div>
                <div>${context.getAuthor()}</div>
                <a href="mailto:${context.getEmail()}" class="blog--email">${context.getEmail()}</a>
              </div>
            </div>
          </div>
        </div>
        `;
    }
    if (blogExcerptString) {
      blogExcerptHTML = `
        <section class="blog--excerpt">
          <blockquote>${blogExcerptString}</blockquote>
        </section>
        `;
    }

    $('#Content').before(`
        ${blogHeaderHTML}
        ${blogExcerptHTML}
      `);

    context.getPerfMeasure('addHeaderBlog');
  };
};
