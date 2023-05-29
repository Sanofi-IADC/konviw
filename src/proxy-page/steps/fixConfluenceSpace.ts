import * as cheerio from 'cheerio';
import { ConfigService } from '@nestjs/config';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import { ConfluenceService } from '../../confluence/confluence.service';

/* eslint-disable no-useless-escape, prefer-regex-literals */
export default (config: ConfigService, confluence: ConfluenceService): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('fixConfluenceSpace');

  const $ = context.getCheerioBody();

  const confluenceSpaceClassList = 'confluence-space';
  const confluenceSpaceIconClassList = 'confluence-space-icon';

  const confluenceBaseURL = config.get('confluence.baseURL');

  const fetchResourcesCallback = async (element: cheerio.Element & { children: { data: string }[] }) => {
    const [, , , spaceKey] = element.attribs.href.split('/');
    const { data } = await confluence.getSpaceMetadata(spaceKey);
    return data;
  };

  const createImagePath = (icon: { path: string }) =>
    `${confluenceBaseURL}/wiki${icon.path}`;

  $('a').each((_, anchor) => {
    const confluenceSpaceRegex = new RegExp('^(.*?)(/wiki/spaces/)(.*)$');
    const href = anchor?.attribs?.href ?? '';
    // retrieves the text value displayed by the link
    const textLink = $(anchor).text() ?? '';
    // this test that the value text looks also as a Confluence space URL
    const isUrlLink = confluenceSpaceRegex.test(textLink);
    // links to pages are tagged with special attribute data-linked-resource-type='page'
    const isPage = anchor?.attribs['data-linked-resource-type'] === 'page';
    // only if it is not a Confluence page and the URL looks like an space will add the special className
    const isConfluenceSpace = confluenceSpaceRegex.test(href) && isUrlLink && !isPage;
    if (isConfluenceSpace) {
      $(anchor).replaceWith(`<a className="${confluenceSpaceClassList}" target="_blank" href="${href}">${textLink}</a>`);
    }
  });

  const confluenceSpacesCollection = $(`a[className="${confluenceSpaceClassList}"]`).toArray();

  const confluenceSpacesPromisses = confluenceSpacesCollection.map((element: cheerio.Element & { children: { data: string }[] }) =>
    fetchResourcesCallback(element)
      .then(
        ({
          name,
          key,
          homepage,
          icon,
        }) => {
          const href = `/wiki/spaces/${key}/pages/${homepage.id}`;
          const imagePath = createImagePath(icon);
          if (imagePath) {
            $(element).replaceWith(`<a class="${confluenceSpaceClassList}" href="${href}">
              <img class="${confluenceSpaceIconClassList}" src="${imagePath}"/>${name}
            </a>`);
          } else {
            $(element).replaceWith(`<a class="${confluenceSpaceClassList}" href="${href}"><${name}</a>`);
          }
        },
      )
      .catch((error) => {
        console.log(`Confluence space link metadata fetch error: ${error}`); // eslint-disable-line no-console
      }));

  await Promise.all(confluenceSpacesPromisses);

  context.getPerfMeasure('fixConfluenceSpace');
};