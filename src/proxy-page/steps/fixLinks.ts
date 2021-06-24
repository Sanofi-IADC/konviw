import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    const logger = new Logger('fixLinks');
    context.setPerfMark('fixLinks');

    const $ = context.getCheerioBody();
    const confluenceBaseURL = config.get('confluence.baseURL');
    const webBasePath = config.get('web.basePath');

    // External links are tagged with the class external-link
    $('a.external-link').each((_index: number, element: CheerioElement) => {
      $(element).attr('target', '_blank');
    });

    const domain = confluenceBaseURL.toString().replace(/https?:\/\//, '');
    // For direct Url and Uri we look for two patterns
    // $1 the domain to remove and $2 the rest of the URL to keep
    const searchUrl = new RegExp(`(https?://${domain}/wiki)(.*)`);
    const searchUri = new RegExp(`(\/wiki)(.*)`);
    // For Url and Uri with anchor we look for four patterns
    // $1 the domain to remove, $2 the path of the pag, $3 the title and $4 the heading achor
    const searchUrlwithAnchor = new RegExp(
      `(https?://${domain}/wiki)(.*\/)(.*)#(.*)`,
    );
    const searchUriwithAnchor = new RegExp(`(\/wiki)(.*\/)(.*)#(.*)`);

    const replaceAttributeLink = (attr: string, link: CheerioElement) => {
      const [, , pathPageAnchorUrl, titlePageUrl, headingPageUrl] =
        searchUrlwithAnchor.exec($(link).attr(attr)) ?? [];
      const [, , pathPageAnchorUri, titlePageUri, headingPageUri] =
        searchUriwithAnchor.exec($(link).attr(attr)) ?? [];
      const [, , pathPageUrl] = searchUrl.exec($(link).attr(attr)) ?? [];
      const [, , pathPageUri] = searchUri.exec($(link).attr(attr)) ?? [];

      // ! Yet no solved the pattern when hyphen symbol is partin the title
      if (pathPageAnchorUrl) {
        $(link).attr(
          attr,
          `${webBasePath}/wiki${pathPageAnchorUrl}#` +
            `${titlePageUrl.replace(/\+/g, '')}-` +
            `${headingPageUrl.replace(/\-/g, '')}`,
        );
        // if there is no display text for the Url we try to compose one
        if ($(link).html() === '') {
          $(link).text(
            `${titlePageUrl.replace(/\+/g, ' ')} | ${headingPageUrl.replace(
              /\-/g,
              ' ',
            )}`,
          );
        }
      } else if (pathPageAnchorUri) {
        $(link).attr(
          attr,
          `${webBasePath}/wiki${pathPageAnchorUri}#` +
            `${titlePageUri.replace(/\+/g, '')}-` +
            `${headingPageUri.replace(/\-/g, '')}`,
        );
        // if there is no display text for the Url we try to compose one
        if ($(link).html() === '') {
          $(link).text(
            `${titlePageUri.replace(/\+/g, ' ')} | ${headingPageUri.replace(
              /\-/g,
              ' ',
            )}`,
          );
        }
      } else if (pathPageUrl) {
        // Step 1: replace absolute URLs by absolute URIs
        $(link).attr(attr, `${webBasePath}/wiki${pathPageUrl}`);
      } else if (pathPageUri) {
        // Step 2: replace URIs with the correct base path
        $(link).attr(attr, `${webBasePath}/wiki${pathPageUri}`);
      }

      // (Optional) Step 3: add resized URLs in srcset attribute on resized images
      if (link.tagName === 'img') {
        const imgWidth = link.attribs.width;
        // If the image has been resized, it had a width attribute
        if (imgWidth) {
          // Remove the old, wrong srcset links and add the new one with the corresponding width for standards
          link.attribs.srcset = `${link.attribs.src} ${imgWidth}w`;
        }
      }
    };

    // Let's find Confluence links to pages
    logger.log('Replacing links URLs');
    $('a').each((_index: number, link: CheerioElement) => {
      replaceAttributeLink('href', link);
    });
    // Let's find Confluence links to images
    logger.log('Replacing images URLs');
    $('img').each((_index: number, link: CheerioElement) => {
      replaceAttributeLink('src', link);
    });

    // Remove links from user mentions
    $('a.confluence-userlink.user-mention').each(
      (_index: number, link: CheerioElement) => {
        delete link.attribs.href;
      },
    );

    context.getPerfMeasure('fixLinks');
  };
};
