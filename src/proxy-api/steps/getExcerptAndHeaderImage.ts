import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-api.step';
import { ConfluenceService } from '../../confluence/confluence.service';

// This module search for the right image and a blockquote to set them as blog post header image and headline
export default (config: ConfigService, confluence: ConfluenceService): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('getExcerptAndHeaderImage');

  const $ = context.getCheerioBody();
  const webBasePath = config.get('web.absoluteBasePath');

  // default blog header is the headerImage
  let blogImgSrc = context.getHeaderImage();
  if (blogImgSrc && !blogImgSrc.startsWith('http')) {
    // not a URL (image uploaded to Confluence)
    const attachments = await confluence.getAttachments(context.getPageId());
    if (attachments) {
      const blogImgAttachment = attachments.find((e) =>
      // find the attachment matching the UID got from the headerImage attribute
        e.fileId === blogImgSrc);
      if (blogImgAttachment) {
        blogImgSrc = `${webBasePath}/wiki${blogImgAttachment?.downloadLink}`;
        context.setHeaderImage(blogImgSrc);
      }
    }
  }

  // Excerpt macro is parsed with classes 'conf-macro' and 'output-inline' and data-macro-name='excerpt'
  context.setExcerpt('');
  $(".conf-macro.output-inline[data-macro-name='excerpt']")
    .first()
    .each((_index: number, elementExcerpt: cheerio.Element) => {
      const excerptPage = $(elementExcerpt);
      context.setExcerpt(excerptPage.text());
    });

  // if not excerpt at all then alternatively we take a summary of the body of the document
  if (context.getExcerpt() === '') {
    const tmpTextBody = context.getTextBody();
    context.setExcerpt(
      tmpTextBody.substring(0, tmpTextBody.lastIndexOf(' ', 500)),
    );
  }

  context.setImgBlog(blogImgSrc);

  context.getPerfMeasure('getExcerptAndHeaderImage');
};
