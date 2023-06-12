import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addAuthor_Version');
  const $ = context.getCheerioBody();
  const author = context.getAuthor();
  const image_author = context.getAvatar();
  const version = context.getLastVersion()
  
  const firstH1 = $('h1:first-of-type');
  firstH1.after(`<div class="author_header"><img src="${image_author}" class="author_image"><div class="author_textbox"><p class="author_text">Creator : ${author}</p><p class="author_text">Page version : ${version && version.versionNumber}</p></div></div>`);
  context.getPerfMeasure('addAuthor_Version');
  
};
