import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-api.step';
import { ConfluenceService } from '../../confluence/confluence.service';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';

// This module search for the first Page Properties macro in the page and collects the image
// and a blockquote to set them as blog post header image and blog blockquote
export default (config: ConfigService, confluence: ConfluenceService): Step => {
  return async (context: ContextService): Promise<void> => {
    const $ = context.getCheerioBody();
    const webBasePath = config.get('web.absoluteBasePath');
    let blogImgSrc = context.getHeaderImage(); // default blog header is the headerImage
    if (blogImgSrc && !blogImgSrc.startsWith('http')) {
      // not a URL (image uploaded to Confluence)
      const attachments = await confluence.getAttachments(context.getPageId());
      const blogImgAttachment = attachments.find((e) => {
        return e?.extensions?.fileId === blogImgSrc; // find the attachment matching the UID got from the headerImage attribute
      });
      if (blogImgAttachment) {
        blogImgSrc = `${webBasePath}/wiki${blogImgAttachment?._links?.download}`;
      }
    }
    $(".plugin-tabmeta-details[data-macro-name='details']")
      .first()
      .each((_index: number, elementProperties: cheerio.Element) => {
        const imgBlog = $(elementProperties).find('img');
        const excerptBlog = $(elementProperties).find('blockquote');
        if (!blogImgSrc) {
          blogImgSrc = imgBlog?.attr('src'); // headerIMage has priority over page-proterties's image
        }
        context.setImgBlog(blogImgSrc);
        context.setExcerpt(excerptBlog.html());
      });
  };
};
