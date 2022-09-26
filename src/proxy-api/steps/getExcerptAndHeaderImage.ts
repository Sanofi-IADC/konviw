import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-api.step';
import { ConfluenceService } from '../../confluence/confluence.service';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';

// This module search for the right image and a blockquote to set them as blog post header image and headline
export default (config: ConfigService, confluence: ConfluenceService): Step => {
  return async (context: ContextService): Promise<void> => {
    context.setPerfMark('getExcerptAndHeaderImage');

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
        context.setHeaderImage(blogImgSrc);
      }
    }

    // a macro page-properties with an image and blockquote inside will be used alternatively to define both image and blockquote for the blog post
    $(".plugin-tabmeta-details[data-macro-name='details']")
      .first()
      .each((_index: number, elementProperties: cheerio.Element) => {
        const imgBlog = $(elementProperties).find('img');
        const excerptBlog = $(elementProperties).find('blockquote');
        if (!blogImgSrc) {
          // header image has priority over page-proterties's image
          blogImgSrc = imgBlog?.attr('src');
          context.setHeaderImage(blogImgSrc);
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

    // Excerpt macro is parsed as a span block with classes 'conf-macro' and 'output-inline'
    // and data-macro-name='excerpt'
    // Unfortunately if the property hidden=true the styled_body will not return the excerpt
    // context.setExcerpt('');
    $("span.conf-macro.output-inline[data-macro-name='excerpt']")
      .first()
      .each((_index: number, elementExcerpt: cheerio.Element) => {
        const excerptPage = $(elementExcerpt);
        context.setExcerpt(excerptPage.text());
      });

    context.getPerfMeasure('getExcerptAndHeaderImage');
  };
};
