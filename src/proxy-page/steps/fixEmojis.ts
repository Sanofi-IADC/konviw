import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfluenceService } from '../../confluence/confluence.service';

export default (config: ConfigService, confluence: ConfluenceService): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('fixEmojis');
  const $ = context.getCheerioBody();
  const confluenceBaseUrl = config.get('confluence.baseURL');

  const imgEmoticons = $('img.emoticon').toArray();

  if (imgEmoticons.length > 0) {
    const atlassianSpecialEmojis = await confluence.getSpecialAtlassianIcons();

    const imgEmoticonsPromisses = imgEmoticons.map((element: cheerio.Element) => {
      const emojiData = $(element).data() as { emojiId: string | number, emojiFallback: string };
      const emojiIdIsStringInstance = typeof emojiData.emojiId === 'string';
      const emojiIdIsNumberInstance = typeof emojiData.emojiId === 'number';

      // define all cases for emojis
      const emojiIdIsCustomAtlassianEmmoticon = emojiData.emojiFallback.startsWith(':') && emojiData.emojiFallback.endsWith(':');
      const emojiIdIsSpecialAtlassianEmoticon = emojiIdIsStringInstance && (emojiData.emojiId as string).startsWith('atlassian');
      const emojiIdWithCPVHref = (emojiIdIsStringInstance && emojiIdIsSpecialAtlassianEmoticon) || emojiIdIsNumberInstance;

      if (emojiIdIsCustomAtlassianEmmoticon) {
        const relatedIcon = atlassianSpecialEmojis.find(({ fallback }) => fallback === emojiData.emojiFallback);
        if (relatedIcon) {
          const { representation: { imagePath } } = relatedIcon;
          return asiggnEmojiSource(element, $, imagePath);
        }
        return $(element).replaceWith(null);
      }
      if (emojiIdWithCPVHref) {
        return asiggnEmojiSource(element, $, cpvBaseUrlIconFactory(element, $, confluenceBaseUrl));
      }
      return $(element).replaceWith(emojiData.emojiFallback);
    });

    await imgEmoticonsPromisses;
  }

  const convertUnicodeToChar = (text: string) =>
    text.replace(/\\u[\dA-F]{4}/gi, (match) =>
      String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));

  $('h1,h2,h3,h4,h5,h6').each((_, element) => {
    const emoticons = element?.children?.length > 0 && element.children.filter((child: any) =>
      child?.data?.includes('\\'));

    if (emoticons.length > 0) {
      $(emoticons).each((__, emoticonHeader: cheerio.Node & { data: string }) => {
        const convertedHeader = convertUnicodeToChar(emoticonHeader.data);
        // eslint-disable-next-line no-param-reassign
        emoticonHeader.data = convertedHeader;
      });
    }
  });

  context.getPerfMeasure('fixEmojis');
};

function asiggnEmojiSource(element: cheerio.Element, $: cheerio.CheerioAPI, url: string) {
  $(element).attr('src', url);
  $(element).attr('srcset', url);
}

function cpvBaseUrlIconFactory(element: cheerio.Element, $: cheerio.CheerioAPI, confluenceBaseUrl: string) {
  return $(element).attr('src').replace(/.*\/cpv/, confluenceBaseUrl);
}
