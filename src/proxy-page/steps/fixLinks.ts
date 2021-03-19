import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import Config from '../../config/config';
// import { Logger } from '@nestjs/common';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    // const logger = new Logger('fixLinks');
    context.setPerfMark('fixLinks');
    // performance.mark('fixLinks-init');

    const $ = context.getCheerioBody();
    const confluenceBaseURL = config.get<Config>('confluence.baseURL');
    const webBasePath = config.get<Config>('web.basePath');

    // External links are tagged with the class external-link
    $('a.external-link').each((_index: number, element: CheerioElement) => {
      $(element).attr('target', '_blank');
    });

    const domain = confluenceBaseURL.toString().replace(/https?:\/\//, '');
    // We look for two patterns $1 the domain to remove and $2 the rest of the URL to keep
    const searchUrl = new RegExp(`(https?://${domain}/wiki)(.*)`, 'g');
    const searchUri = new RegExp(`(\/wiki)(.*)`, 'g');

    // Let's find Confluence links to pages
    $('a').each((_index: number, link: CheerioElement) => {
      if ($(link).attr('href').match(searchUrl)) {
        // Step 1: replace absolute URLs by absolute URIs
        $(link).attr(
          'href',
          $(link).attr('href').replace(searchUrl, `${webBasePath}/wiki$2`),
        );
      } else if ($(link).attr('href').match(searchUri)) {
        // Step 2: replace URIs with the correct base path
        $(link).attr(
          'href',
          $(link).attr('href').replace(searchUri, `${webBasePath}/wiki$2`),
        );
      }
    });
    // Let's find Confluence links to images
    $('img').each((_index: number, link: CheerioElement) => {
      if ($(link).attr('src').match(searchUrl)) {
        // Step 1: replace absolute URLs by absolute URIs
        $(link).attr(
          'src',
          $(link).attr('src').replace(searchUrl, `${webBasePath}/wiki$2`),
        );
      } else if ($(link).attr('src').match(searchUri)) {
        // Step 2: replace URIs with the correct base path
        $(link).attr(
          'src',
          $(link).attr('src').replace(searchUri, `${webBasePath}/wiki$2`),
        );
      }
    });

    // We have improved this code by parsing links and images with Cheerio
    // and replace them like this instead of doing a big regex on the whole HTML page.
    // Because it may break some real texts containing "/wiki" that we don't want to replace.

    // Step 1: replace absolute URLs by absolute URIs
    // const domain = confluenceBaseURL.toString().replace(/https?:\/\//, '');
    // const searchUrl = new RegExp(`"(https?://)?${domain}/wiki`, 'g');
    // const replaceUrl = '"/wiki';
    // context.setHtmlBody(context.getHtmlBody().replace(searchUrl, replaceUrl));

    // Step 2: replace URIs with the correct base path
    // const searchUri = new RegExp(`"/wiki`, 'g');
    // const replaceUri = `"${webBasePath}/wiki`;
    // context.setHtmlBody(context.getHtmlBody().replace(searchUri, replaceUri));

    context.getPerfMeasure('fixLinks');
  };
};
