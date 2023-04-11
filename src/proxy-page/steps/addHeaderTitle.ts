import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addTitleHeader');
  const $ = context.getCheerioBody();

  const element = headerTitleFactory(context, headerIconFacatory(context));

  if (context.getTitle()) {
    $('#Content').prepend(element);
  }
  context.getPerfMeasure('addTitleHeader');
};

function headerTitleFactory(context: ContextService, icon: string | HTMLElement) {
  const title = context.getTitle();
  return `<h1 class="titlePage">${icon} ${title}</h1>`;
}

function headerIconFacatory(context: ContextService) {
  const emoji = context.getHeaderEmoji();

  if (emoji?.length > 0) {
    const specialAtlassianEmoji = emoji.substring(3, 12) === 'atlassian';
    if (specialAtlassianEmoji) {
      return headerTitleFactoryWithAtlassianIcon(emoji);
    }
    return emoji;
  }
  return '';
}

function headerTitleFactoryWithAtlassianIcon(emoji: string) {
  // Base URL where atlassian is storing special icons
  const emojiAtlassianService = 'https://pf-emoji-service--cdn.us-east-1.prod.public.atl-paas.net/atlassian/';
  // Remove unnecessary part of icon name
  const convertedIconName = emoji.substring(3).replace('atlassian-', '').replace(';', '');
  const url = `${emojiAtlassianService}${convertedIconName}_32.png`;
  return `<img class="titleIcon" alt="${convertedIconName}" srcset="${url}" src="${url}" />`;
}
