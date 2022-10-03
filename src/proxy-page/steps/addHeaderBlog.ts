import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('addHeaderBlog');
  const $ = context.getCheerioBody();

  const blogImgSrc = context.getHeaderImage();
  let blogHeaderHTML = '';

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

  $('#Content').before(`${blogHeaderHTML}`);

  // TODO: [WEB-344] to be removed and release new major version
  // this section is just to keep retro-compatibility with the header images
  // defined in a page-properties section in a blog post
  $(".plugin-tabmeta-details[data-macro-name='details']")
    .first()
    .each((_index: number, elementProperties: cheerio.Element) => {
      $(elementProperties).remove();
    });

  context.getPerfMeasure('addHeaderBlog');
};
