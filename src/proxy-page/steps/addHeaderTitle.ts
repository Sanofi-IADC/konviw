import { ConfluenceService } from '../../confluence/confluence.service';
import { ContextService } from '../../context/context.service';
import { EmojiType } from '../../context/context.interface';
import { Step } from '../proxy-page.step';

export default (confluence: ConfluenceService): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('addTitleHeader');
  const $ = context.getCheerioBody();
  const { code, type, path } = await headerIconFacatory(context, confluence);
  const title = context.getTitle();
  if (type === 'atlassian' || type === 'upload') {
    var imgHtml = path ? '<img src="' + path + '"/>' : '';
    $('#Content').prepend(
      '<h1 class="titlePage"><div class="specialAtlassian">' +
      imgHtml + '&nbsp;' + title +
      '</div></h1>'
    );
  } else {
    $('#Content').prepend(`<h1 class="titlePage">${code} ${title}</h1>`); // to set page title
  }
  context.getPerfMeasure('addTitleHeader');
};

async function headerIconFacatory(context: ContextService, confluence: ConfluenceService): Promise<EmojiType> {
  const emoji: EmojiType = context.getHeaderEmoji();
  if (emoji.type === 'atlassian') {
    emoji.path = await confluence.getSpecialAtlassianIcons(emoji.code);
  }
  if (emoji.type === 'upload') {
    emoji.path = await confluence.getSpecialUploadedIcons(emoji.code);
  }
  return emoji;
}
