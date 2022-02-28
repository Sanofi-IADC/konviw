import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixEmojis');
    const $ = context.getCheerioBody();
    const confluenceBaseUrl = config.get('confluence.baseURL');

    // img tag with class emoticon is used to wrap the Confluence emoticons
    $('img.emoticon').each((_index: number, element: cheerio.Element) => {
      const thisEmoji = $(element).data();
      // condition to detect special Atlassian emoticons
      if (
        (typeof thisEmoji.emojiId === 'string' &&
          (thisEmoji.emojiId as string).substring(0, 9) === 'atlassian') ||
        typeof thisEmoji.emojiId === 'number'
      ) {
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
};
