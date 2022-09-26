import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-api.step';
import { ConfluenceService } from '../../confluence/confluence.service';

// This module search for the right image and a blockquote to set them as blog post header image and headline
export default (config: ConfigService, confluence: ConfluenceService): Step => async (context: ContextService): Promise<void> => {
  const $ = context.getCheerioBody();
  const webBasePath = config.get('web.absoluteBasePath');
  let blogImgSrc = context.getHeaderImage(); // default blog header is the headerImage
  if (blogImgSrc && !blogImgSrc.startsWith('http')) {
    // not a URL (image uploaded to Confluence)
    const attachments = await confluence.getAttachments(context.getPageId());
    // find the attachment matching the UID got from the headerImage attribute
    const blogImgAttachment = attachments.find((e) => e?.extensions?.fileId === blogImgSrc);
    if (blogImgAttachment) {
      blogImgSrc = `${webBasePath}/wiki${blogImgAttachment?._links?.download}`;
    }
  }

  /* a macro page-properties with an image and blockquote inside
  will be used alternatively to define both image and blockquote for the blog post */
  $(".plugin-tabmeta-details[data-macro-name='details']")
    .first()
    .each((_index: number, elementProperties: cheerio.Element) => {
      const imgBlog = $(elementProperties).find('img');
      const excerptBlog = $(elementProperties).find('blockquote');
      if (!blogImgSrc) {
        // header image has priority over page-proterties's image
        blogImgSrc = imgBlog?.attr('src');
      }
      context.setExcerpt(excerptBlog.html());
    });

  // alternatively a single first blockquote will be used as headline for the blog post
  $('blockquote')
    .first()
    .each((_index: number, elementProperties: cheerio.Element) => {
      context.setExcerpt($(elementProperties).html());
    });
  context.setImgBlog(blogImgSrc);
};
