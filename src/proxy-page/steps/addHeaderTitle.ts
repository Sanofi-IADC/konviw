import { ConfluenceService } from '../../confluence/confluence.service';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

type IconType = 'atlassian' | 'custom' | 'standard';

export default (confluence: ConfluenceService): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('addTitleHeader');
  const $ = context.getCheerioBody();

  const { type, path } = await headerIconFacatory(context, confluence);

  if (context.getTitle()) {
    $('#Content').prepend(headerTitleFactory(context, path, type as IconType));
  }

  context.getPerfMeasure('addTitleHeader');
};

function headerTitleFactory(context: ContextService, icon: string | HTMLElement, type: IconType) {
  const title = context.getTitle();
  if (type === 'atlassian' || type === 'custom') {
    return `<h1 class="titlePage"><div class="specialAtlassian"><img src="${icon}" />${title}</div></h1>`;
  }
  return `<h1 class="titlePage">${icon} ${title}</h1>`;
}

function getSpecialEmojiData(emoji: string) {
  const specialCustomEmoji = emoji.startsWith(':') && emoji.endsWith(':');
  if (specialCustomEmoji) {
    const [, iconName] = emoji.split(':');
    return { iconName, type: 'custom' };
  }

  const specialAtlassianEmoji = emoji.substring(3, 12) === 'atlassian';
  if (specialAtlassianEmoji) {
    const [, iconName] = emoji.split('&#x');
    return { iconName: iconName.substring(0, iconName.length - 1), type: 'atlassian' };
  }
}

async function headerIconFacatory(context: ContextService, confluence: ConfluenceService) {
  const emoji = context.getHeaderEmoji();

  if (emoji?.length > 0) {
    const specialIconData = getSpecialEmojiData(emoji);
    if (specialIconData) {
      const { iconName, type } = specialIconData;

      const imageData = await confluence.getSpecialAtlassianIcons(iconName);

      if (imageData) {
        return { type, path: imageData.representation.imagePath };
      }
      return { type: 'standard', path: '' };
    }
    return { type: 'standard', path: emoji };
  }
  return { type: 'standard', path: '' };
}
