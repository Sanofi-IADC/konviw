import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { HttpService } from '@nestjs/axios';
import { Observable, firstValueFrom, timeout } from 'rxjs';
import { AxiosResponse } from 'axios'; // eslint-disable-line import/no-extraneous-dependencies
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import { JiraService } from '../../jira/jira.service';

/* eslint-disable no-useless-escape, prefer-regex-literals */
export default (config: ConfigService, http: HttpService, jira: JiraService): Step => async (context: ContextService): Promise<void> => {
  const logger = new Logger('fixLinks');
  context.setPerfMark('fixLinks');

  const $ = context.getCheerioBody();
  const confluenceBaseURL = config.get('confluence.baseURL');
  const webBasePath = config.get('web.absoluteBasePath');

  const isValidURL = (favicon: string) => {
    try {
      const url = new URL(favicon);
      const protocols = ['http:', 'https:'];
      return protocols.includes(url.protocol);
    } catch (_) {
      return false;
    }
  };

  const isConfluenceSpaceIcon = (link: cheerio.Element) =>
    $(link).hasClass('confluence-space-icon');

  const createImagePath = (favicon: string, url: string) => {
    if (favicon) {
      const base = new URL(url).origin;
      return isValidURL(favicon) ? favicon : `${base}${favicon}`;
    }
    return '';
  };

  const toogleImageDisplayAttribiute = (link: cheerio.Element) => {
    const href = $(link).attr().src;
    const existHrefAttribiute = href?.length;
    if (!existHrefAttribiute) {
      $(link).addClass('hidden');
    }
  };

  const externalResourcesFactory = (url: string, data: any) => {
    const body = cheerio.load(data);
    const title = body('head title').text();
    const favicon = (body('head link[rel="shortcut icon"]').attr('href') || body('head link[rel="icon"]').attr('href')) ?? '';
    const description = body('head meta[name="description"]').attr(
      'content',
    ) ?? '';
    const imageSrc = body(
      'head meta[name="twitter:image"], head meta[property="og:image"]',
    ).attr('content');
    const path = createImagePath(favicon, url);
    return {
      title,
      description,
      imageSrc,
      path,
      classIconName: 'favicon',
    };
  };

  const jiraResponseFactory = (data: any) => ({
    title: data.name,
    description: data.description,
    imageSrc: data.avatarUrls['48x48'],
    path: data.avatarUrls['48x48'],
    classIconName: 'jira-space-icon',
  });

  const isJiraSpace = (url: string) => {
    const jiraSpaceUrls = [
      `${confluenceBaseURL}/browse`,
      `${confluenceBaseURL}/jira`,
    ];
    return jiraSpaceUrls.some((jiraURL) => url.startsWith(jiraURL));
  };

  const httpObservableFactory = <T>(httpObservable: Observable<AxiosResponse<T>>) =>
    httpObservable.pipe(timeout(5000));

  const fetchResourcesCallback = (url: string) => {
    const jiraSpace = isJiraSpace(url);
    if (jiraSpace) {
      const [, , , , , , , spaceKey] = url.split('/');
      return jira.findProjectMetadata(spaceKey);
    }
    return firstValueFrom(httpObservableFactory(http.get(url)));
  };

  // External links are tagged with the class external-link
  const externalLinksArray = $('a.external-link').toArray();
  $(externalLinksArray).each((_index: number, element: cheerio.Element) => {
    $(element).attr('target', '_blank');
  });

  // Inline & Card links display
  const externalLinksPromises = externalLinksArray.map((element: cheerio.Element) => {
    const url = $(element).attr('href');
    const dataCardAppearance = $(element).attr('data-card-appearance');
    if (!dataCardAppearance) {
      return null;
    }

    return fetchResourcesCallback(url).then((res) => {
      const isJiraResponse = res?.data?.expand;

      const {
        title,
        description,
        imageSrc,
        path,
        classIconName,
      } = isJiraResponse
        ? jiraResponseFactory(res.data)
        : externalResourcesFactory(url, res.data);

      let replacement = '';

      if (dataCardAppearance === 'inline') {
        replacement = `<a target="_blank" href="${url}"> <img class="${classIconName}" src="${path}"/> ${title}</a>`;
      }

      if (dataCardAppearance === 'block') {
        const imgTag = imageSrc ? `<img class="link-card-image" src="${imageSrc}"/>` : '';
        replacement = `
          <div class="link-card">
            <div class="link-card-content">
              <a target="_blank" href="${url}"> <img class="${classIconName}" src="${path}"/> ${title}</a>
              <p class="link-card-description">${description ?? ''}</p>
              <a target="_blank" href="${getDomain(url)}">${getDomain(url)}</a>
            </div>
            ${imgTag}
          </div>`;
      }

      if (replacement) {
        $(element).replaceWith(replacement);
      }
    })
      .catch((error) => {
        console.log(`Smart link metadata fetch error: ${error}`); // eslint-disable-line no-console
      });
  });

  await Promise.all(externalLinksPromises);

  const domain = confluenceBaseURL.toString().replace(/https?:\/\//, '');
  // For direct Url and Uri we look for two patterns
  // $1 the domain to remove and $2 the rest of the URL to keep
  const searchUrl = new RegExp(`(https?://${domain}/wiki)(.*)`);
  const searchUri = new RegExp('^(\/wiki)(.*)');
  // For Url and Uri with anchor we look for four patterns
  // $1 the domain to remove, $2 the path of the pag, $3 the title and $4 the heading achor
  const searchUrlwithAnchor = new RegExp(
    `(https?://${domain}/wiki)(.*\/)(.*)#(.*)`,
  );
  const searchUriwithAnchor = new RegExp('^(\/wiki)(.*\/)(.*)#(.*)');

  const composeTextFactory = (title: string, heading: string) =>
    `${title.replace(/\+/g, ' ')} | ${heading.replace(
      /\-/g,
      ' ',
    )}`;

  const composeUrlFactory = (path: string, title: string, heading: string) =>
    `${webBasePath}/wiki${path}#`
      + `${title.replace(/\+/g, '')}-`
      + `${heading.replace(/\-/g, '')}`;

  const verifyComposeUrl = (link: cheerio.Element) => {
    const text = $(link).html();
    return text === '' || text.startsWith(confluenceBaseURL);
  };

  const replaceAttributeLink = (attr: string, link: cheerio.Element) => {
    const [, , pathPageAnchorUrl, titlePageUrl, headingPageUrl] = searchUrlwithAnchor.exec($(link).attr(attr)) ?? [];
    const [, , pathPageAnchorUri, titlePageUri, headingPageUri] = searchUriwithAnchor.exec($(link).attr(attr)) ?? [];
    const [, , pathPageUrl] = searchUrl.exec($(link).attr(attr)) ?? [];
    const [, , pathPageUri] = searchUri.exec($(link).attr(attr)) ?? [];

    // ! Yet no solved the pattern when hyphen symbol is partin the title
    if (pathPageAnchorUrl) {
      $(link).attr(
        attr,
        composeUrlFactory(pathPageAnchorUrl, titlePageUrl, headingPageUrl),
      );
      // if there is no display text for the Url we try to compose one or modify if starts with confluence domain
      if (verifyComposeUrl(link)) {
        $(link).text(composeTextFactory(titlePageUrl, headingPageUrl));
      }
    } else if (pathPageAnchorUri) {
      $(link).attr(
        attr,
        composeUrlFactory(pathPageAnchorUri, titlePageUri, headingPageUri),
      );
      // if there is no display text for the Url we try to compose one
      if (verifyComposeUrl(link)) {
        $(link).text(composeTextFactory(titlePageUri, headingPageUri));
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
        // eslint-disable-next-line no-param-reassign
        link.attribs.srcset = `${link.attribs.src} ${imgWidth}w`;
      }
    }
  };

  // Let's find Confluence links to pages
  logger.log('Replacing links URLs');
  $('a').each((_index: number, link: cheerio.Element) => {
    replaceAttributeLink('href', link);
  });

  // Let's find Confluence links to images
  logger.log('Replacing images URLs');
  $('img').each((_index: number, link: cheerio.Element) => {
    toogleImageDisplayAttribiute(link);
    if (!isConfluenceSpaceIcon(link)) {
      replaceAttributeLink('src', link);
    }
  });

  // Remove links from user mentions
  $('a.confluence-userlink.user-mention').each(
    (_index: number, link: cheerio.Element) => {
      // eslint-disable-next-line no-param-reassign
      delete link.attribs.href;
    },
  );

  context.getPerfMeasure('fixLinks');
};

// Helpers

// Get the domain of a url
const getDomain = (url: string) => new URL(url).host;
