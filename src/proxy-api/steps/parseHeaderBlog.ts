import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-api.step';
import * as cheerio from 'cheerio';

// This module search for the first Page Properties macro in the page and collects the image
// and a blockquote to set them as blog post header image and blog blockquote
export default (body: string): Step => {
  return (context: ContextService): void => {
    context.setHtmlBody(body);
    const $ = context.getCheerioBody();
    $(".plugin-tabmeta-details[data-macro-name='details']")
      .first()
      .each((_index: number, elementProperties: cheerio.Element) => {
        const imgBlog = $(elementProperties).find('img');
        const excerptBlog = $(elementProperties).find('blockquote');
        context.setImgBlog(imgBlog.attr('src'));
        context.setExcerpt(excerptBlog.html());
      });
  };
};
