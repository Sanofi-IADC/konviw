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
      const emojiIdIsSpecialAtlassianEmoticon = emojiIdIsStringInstance && (emojiData.emojiId as string).substring(0, 9) === 'atlassian';
      const emojiIdWithCPVHref = (emojiIdIsStringInstance && emojiIdIsSpecialAtlassianEmoticon) || emojiIdIsNumberInstance;

      if (emojiIdIsCustomAtlassianEmmoticon) {
        const relatedIcon = atlassianSpecialEmojis.find(({ fallback }) => fallback === emojiData.emojiFallback);
        if (relatedIcon) {
          const { representation: { imagePath } } = relatedIcon;
          return asiggnEmojiSource(element, $, imagePath);
        }
        return asiggnEmojiSource(element, $, cpvBaseUrlIconFactory(element, $, confluenceBaseUrl));
      }
      if (emojiIdWithCPVHref) {
        return asiggnEmojiSource(element, $, cpvBaseUrlIconFactory(element, $, confluenceBaseUrl));
      }
      return $(element).replaceWith(emojiData.emojiFallback);
    });

    await imgEmoticonsPromisses;
  }

  context.getPerfMeasure('fixEmojis');
};

function asiggnEmojiSource(element: cheerio.Element, $: cheerio.CheerioAPI, url: string) {
  $(element).attr('src', url);
  $(element).attr('srcset', url);
}

function cpvBaseUrlIconFactory(element: cheerio.Element, $: cheerio.CheerioAPI, confluenceBaseUrl: string) {
  return $(element).attr('src').replace(/.*\/cpv/, confluenceBaseUrl);
}
