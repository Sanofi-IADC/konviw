import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixEmojis');
    const $ = context.getCheerioBody();
    const confluenceBaseUrl = config.get('confluence.baseURL');

    // img tag with class emoticon is used to wrap the Confluence emoticons
    $('img.emoticon').each((_index: number, element: CheerioElement) => {
      const thisEmoji = $(element).data();
      // condition to detect special Atlassian emoticons
      if (thisEmoji.emojiId.substring(0, 9) === 'atlassian') {
        const fullUrl = $(element)
          .attr('src')
          .replace(/\/cpv/, confluenceBaseUrl);
        $(element).attr('src', fullUrl);
        $(element).attr('srcset', fullUrl);
      } else {
        // go for the fallback emoticon provided by the API
        $(element).replaceWith(thisEmoji.emojiFallback);
      }
    });
    context.getPerfMeasure('fixEmojis');
  };
};
