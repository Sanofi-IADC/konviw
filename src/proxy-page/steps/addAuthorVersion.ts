import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addAuthorVersion');
  const $ = context.getCheerioBody();
  const author = context.getAuthor();
  const image_author = context.getAvatar();
  const version = context.getLastVersion();
  const firstHeader = $('h1:first-of-type');
  firstHeader.after(`<div class="author_header"><img src="${image_author}" class="author_image"><div class="author_textbox">
  <p class="author_text">Creator: ${author}</p><p class="author_text">Page version: ${version?.versionNumber}</p></div></div>`);
  context.getPerfMeasure('addAuthorVersion');
};
