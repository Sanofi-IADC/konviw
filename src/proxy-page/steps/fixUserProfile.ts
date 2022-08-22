import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixUserProfile');
  const $ = context.getCheerioBody();

  // Div with class profile-macro is used for User Profile VCard
  $('div.profile-macro').each(
    (_index: number, elementProfile: cheerio.Element) => {
      const thisBlock = $(elementProfile);
      const imgProfile = $(elementProfile).find('a.userLogoLink');
      const nameProfile = $(elementProfile).find('a.confluence-userlink');
      const emailProfile = $(elementProfile).find('a.email');
      if (thisBlock) {
        $(elementProfile).after(
          `<div class="vcard">${imgProfile.html()}<div class="values"><div>${nameProfile.html()}</div><a href="mailto:${emailProfile.html()}" class="email">${emailProfile.html()}</a></div></div>`,
        );
      }
      $(elementProfile).remove();
    },
  );

  // a with class profile-macro is used for User Profile single avatar
  $('a.userLogoLink').each(
    (_index: number, elementProfile: cheerio.Element) => {
      const imgProfile = $(elementProfile);
      if (imgProfile) {
        $(elementProfile).after(`${imgProfile.html()}`);
      }
      $(elementProfile).remove();
    },
  );

  context.getPerfMeasure('fixUserProfile');
};
