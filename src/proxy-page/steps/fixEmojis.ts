import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
// import { Logger } from '@nestjs/common';

export default (): Step => {
  return (context: ContextService): void => {
    // const logger = new Logger('fixEmojis');
    context.setPerfMark('fixEmojis');
    const $ = context.getCheerioBody();

    // img tag with class emoticon is used to wrap the Confluence emoticons
    $('img.emoticon').each((_index: number, element: CheerioElement) => {
      const thisEmoji = $(element).data();
      if (
        thisEmoji.emojiId.substring(0, 9) === 'atlassian' || // 1st condition to detect special Atlassian emoticons
        thisEmoji.emojiId.substring(5, 6) === '-' // 2nd condition to detect country flags which are not yet supported in Win10
      ) {
        // TODO: Replace this fallback for an image retrived from CDN of special Atlassian emoticons
        // For instance https://pf-emoji-service--cdn.us-east-1.prod.public.atl-paas.net/atlassian/check_mark_64.png for :check_mark:
        $(element).replaceWith(thisEmoji.emojiFallback);
      } else {
        $(element).replaceWith(`&#x${thisEmoji.emojiId}`);
      }
    });
    context.getPerfMeasure('fixEmojis');
  };
};
