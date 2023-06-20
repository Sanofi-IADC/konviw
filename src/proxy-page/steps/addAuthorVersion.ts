import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addAuthorVersion');

  const $ = context.getCheerioBody();

  const author = context.getAuthor();
  const image_author = context.getAvatar();
  const version = context.getLastVersion();
  const type = context.getType();
  const isAuthorType = type.includes('author');
  const isVersionType = type.includes('version');
  const isTitleType = type.includes('title');

  const authorVersionFactory = () => {
    const pageVersionHtml = isVersionType ? `<p class="author_text">Page version: ${version?.versionNumber}</p>` : '';
    const pageAuthorHtml = `<p class="author_text">Creator: ${author}</p>`;

    return `<div class="author_header">
      <img src="${image_author}" class="author_image">
      <div class="author_textbox">
        ${pageAuthorHtml}
        ${pageVersionHtml}
      </div>
    </div>`;
  };

  if (isTitleType && isAuthorType) {
    const firstHeader = $('h1:first');
    firstHeader.after(authorVersionFactory());
  }

  context.getPerfMeasure('addAuthorVersion');
};
