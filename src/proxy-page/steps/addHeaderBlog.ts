import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addHeaderBlog');
    const $ = context.getCheerioBody();

    // Div with class plugin-tabmeta-details is used for macro Page-Properties
    $(".plugin-tabmeta-details[data-macro-name='details']")
      // We just look for the first Page-Properties macro
      .first()
      .each((_index: number, pageProperties: cheerio.Element) => {
        const thisBlock = $(pageProperties);
        const imgBlog = $(pageProperties).find('img');
        const excerptBlog = $(pageProperties).find('blockquote');
        // and take the image and quote to display in the header of the blog post
        if (thisBlock) {
          $('#Content').before(
            `<div class="blog--header"
               style="background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
               url('${imgBlog.attr('src')}');">
           <div class="blog--box">
             <div class="blog--title">
               ${context.getTitle()}
             </div>
             <div>
               <img class="userLogo logo" src="/cpv${context.getAvatar()}">
               <div class="blog--vCard">
                 <div class="blog--when">${context.getFriendlyWhen()} • ${context.getReadTime()} min read</div>
                 <div>${context.getAuthor()}</div>
                 <a href="mailto:${context.getEmail()}" class="blog--email">${context.getEmail()}</a>
               </div>
             </div>
           </div>
         </div>
         <section class="blog--excerpt">
           <blockquote>
             ${excerptBlog.html()}
           </blockquote>
         </section>`,
          );
        }
        $(pageProperties).remove();
      });

    context.getPerfMeasure('addHeaderBlog');
  };
};
