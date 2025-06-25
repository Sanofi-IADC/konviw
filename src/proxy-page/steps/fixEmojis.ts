import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfluenceService } from '../../confluence/confluence.service';

export default (config: ConfigService, confluence: ConfluenceService): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('fixEmojis');
  const $ = context.getCheerioBody();
  const imgEmoticons = $('img.emoticon').toArray();

  if (imgEmoticons.length > 0) {
    const atlassianSpecialEmojis = await confluence.getSpecialAtlassianIcons();
    const uploadedSpecialEmojis = await confluence.getSpecialUploadedIcons();

    const imgEmoticonsPromises = imgEmoticons.map((element: cheerio.Element) => {
      const emojiData = $(element).data() as { emojiId: string | number, emojiFallback: string };
      const emojiIdIsStringInstance = typeof emojiData.emojiId === 'string';

      // define all cases for emojis
      const emojiIdIsCustomAtlassianEmmoticon = emojiData.emojiFallback.startsWith(':') && emojiData.emojiFallback.endsWith(':');
      const emojiIdIsSpecialAtlassianEmoticon = emojiIdIsStringInstance && (emojiData.emojiId as string).startsWith('atlassian');
      const emojiIdIsSpecialUploadedEmoticon = (((emojiData.emojiId as string).length > 10) && (!emojiIdIsSpecialAtlassianEmoticon));

      if (emojiIdIsSpecialUploadedEmoticon) {
        const relatedIcon = uploadedSpecialEmojis.emojis.find(({ fallback }) => fallback === emojiData.emojiFallback);
        if (relatedIcon) {
          const { representation: { imagePath } } = relatedIcon;
          const { meta } = uploadedSpecialEmojis;
          return asignEmojiSource(element, $, `${imagePath}&token=${meta.mediaApiToken.jwt}&client=${meta.mediaApiToken.clientId}`);
        }
        return $(element).replaceWith(null);
      }

      if (emojiIdIsCustomAtlassianEmmoticon) {
        const relatedIcon = atlassianSpecialEmojis.find(({ fallback }) => fallback === emojiData.emojiFallback);
        if (relatedIcon) {
          const { representation: { imagePath } } = relatedIcon;
          return asignEmojiSource(element, $, imagePath);
        }
        return $(element).replaceWith(null);
      }

      return $(element).replaceWith(emojiData.emojiFallback);
    });

    await imgEmoticonsPromises;
  }

  const convertUnicodeToChar = (text: string) =>
    text.replace(/\\u[\dA-F]{4}/gi, (match) =>
      String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));

  $('h1,h2,h3,h4,h5,h6').each((_, element) => {
    const unicodeEmoticons = element?.children?.length > 0 && element.children.filter((child: any) =>
      typeof child?.data === 'string' && child?.data?.includes('\\'));

    if (unicodeEmoticons.length > 0) {
      $(unicodeEmoticons).each((__, emoticonHeader: cheerio.Node & { data: string }) => {
        const convertedHeader = convertUnicodeToChar(emoticonHeader.data);
        // eslint-disable-next-line no-param-reassign
        emoticonHeader.data = convertedHeader;
      });
    }
  });

  context.getPerfMeasure('fixEmojis');
};

function asignEmojiSource(element: cheerio.Element, $: cheerio.CheerioAPI, url: string) {
  $(element).attr('src', url);
  $(element).attr('srcset', url);
  $(element).attr('width', '20');
  $(element).attr('height', '20');
  $(element).attr('style', 'margin-bottom: -3px');
}
