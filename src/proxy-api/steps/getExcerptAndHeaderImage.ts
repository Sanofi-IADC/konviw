import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-api.step';
import { ConfluenceService } from '../../confluence/confluence.service';

// When Atlassian fails to pre-render a drawio diagram server-side, it injects
// a generic "Failed to load the diagram preview image. / Authentication
// Required / Page ID: <id>" warning macro in place of the diagram. fixDrawio
// recovers the diagram in the rendered body, but this step runs first, so we
// must strip the same text here to avoid leaking it into the excerpt /
// konviwExcerpt metadata.
const DRAWIO_FAILURE_TEXT_REGEX = /Failed to load the diagram preview image\.?\s*Authentication Required\s*Page ID:\s*\d+/gi;

const stripDrawioFailureText = (text: string): string =>
  text.replace(DRAWIO_FAILURE_TEXT_REGEX, '').replace(/\s+/g, ' ').trim();

const isDrawioFailureWarning = ($el: cheerio.Cheerio<cheerio.Element>): boolean =>
  $el.is('.confluence-information-macro-warning')
    && $el.text().includes('Failed to load the diagram preview image');

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
      // If the excerpt macro IS the drawio preview-failure warning, treat
      // it as empty: fixDrawio will recover the diagram and we don't want
      // the failure text leaking into konviwExcerpt.
      if (isDrawioFailureWarning(excerptPage)) {
        return;
      }
      // Otherwise the excerpt may still embed a failure warning as a
      // descendant; clone before mutating so we don't disturb the page DOM
      // that fixDrawio still needs to operate on.
      const cleaned = excerptPage.clone();
      cleaned
        .find('.confluence-information-macro-warning')
        .filter((_i, el) => $(el).text().includes('Failed to load the diagram preview image'))
        .remove();
      context.setExcerpt(stripDrawioFailureText(cleaned.text()));
    });

  // TODO: [WEB-344] to be removed and release new major version
  // this section is just to keep retro-compatibility with the header images
  // defined in a page-properties section in a blog post
  // a macro page-properties with an image and blockquote inside will be used alternatively to define
  // both image and blockquote for the blog post
  // $(".plugin-tabmeta-details[data-macro-name='details']")
  //   .first()
  //   .each((_index: number, elementProperties: cheerio.Element) => {
  //     const imgBlog = $(elementProperties).find('img');
  //     const excerptBlog = $(elementProperties).find('blockquote');
  //     if (!blogImgSrc) {
  //       // header image has priority over page-proterties's image
  //       blogImgSrc = imgBlog?.attr('src');
  //       context.setHeaderImage(blogImgSrc);
  //     }
  //     if (context.getExcerpt() === '') {
  //       context.setExcerpt(excerptBlog.text());
  //     }
  //   });

  // if not excerpt at all then alternatively we take a summary of the body of the document
  if (context.getExcerpt() === '') {
    const tmpTextBody = stripDrawioFailureText(context.getTextBody());
    context.setExcerpt(
      tmpTextBody.substring(0, tmpTextBody.lastIndexOf(' ', 500)),
    );
  }

  context.setImgBlog(blogImgSrc);

  context.getPerfMeasure('getExcerptAndHeaderImage');
};
