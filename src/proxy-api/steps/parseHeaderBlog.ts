import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-api.step';

// This module search for the first excerpt in the page and collects the image
// and a blockquote to set them as blog post header image and blog excerpt
export default (body: string): Step => {
  return (context: ContextService): void => {
    context.setHtmlBody(body);
    const $ = context.getCheerioBody();
    $(".plugin-tabmeta-details[data-macro-name='details']")
      .first()
      .each((_index: number, element: CheerioElement) => {
        const imgBlog = $(element).find('img');
        const excerptBlog = $(element).find('blockquote');
        context.setImgBlog(imgBlog.attr('src'));
        context.setExcerptBlog(excerptBlog.html());
      });
  };
};
