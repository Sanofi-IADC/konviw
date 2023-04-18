import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (config: ConfigService): Step => (context: ContextService): void => {
  context.setPerfMark('fixEmojis');
  const $ = context.getCheerioBody();
  const confluenceBaseUrl = config.get('confluence.baseURL');

  // img tag with class emoticon is used to wrap the Confluence emoticons
  $('img.emoticon').each((_index: number, element: cheerio.Element) => {
    const thisEmoji = $(element).data();
    const emojiIdIsStringInstance = typeof thisEmoji.emojiId === 'string';
    const emojiIdIsNumberInstance = typeof thisEmoji.emojiId === 'number';
    // condition to detect special Atlassian emoticons
    const emojiIdIsSpecialAtlassianEmoticon = emojiIdIsStringInstance && (thisEmoji.emojiId as string).substring(0, 9) === 'atlassian';
    if (
      (emojiIdIsStringInstance
        && emojiIdIsSpecialAtlassianEmoticon)
      || emojiIdIsNumberInstance) {
      const fullUrl = $(element)
        .attr('src')
        .replace(/.*\/cpv/, confluenceBaseUrl);
      $(element).attr('src', fullUrl);
      $(element).attr('srcset', fullUrl);
    } else {
      // go for the fallback emoticon provided by the API
      $(element).replaceWith(thisEmoji.emojiFallback as string);
    }
  });
  context.getPerfMeasure('fixEmojis');
};
