import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixUserProfile');
    const $ = context.getCheerioBody();

    // Div with class profile-macro is used for User Profile VCard
    $('div.profile-macro').each((_index: number, macro: CheerioElement) => {
      const thisBlock = $(macro);
      const imgProfile = $(macro).find('a.userLogoLink');
      const nameProfile = $(macro).find('a.confluence-userlink');
      const emailProfile = $(macro).find('a.email');
      if (thisBlock) {
        $(macro).after(
          `<div class="vcard">${imgProfile.html()}<div class="values"><div>${nameProfile.html()}</div><a href="mailto:${emailProfile.html()}" class="email">${emailProfile.html()}</a></div></div>`,
        );
      }
      $(macro).remove();
    });

    // a with class profile-macro is used for User Profile single avatar
    $('a.userLogoLink').each((_index: number, macro: CheerioElement) => {
      const imgProfile = $(macro);
      if (imgProfile) {
        $(macro).after(`${imgProfile.html()}`);
      }
      $(macro).remove();
    });

    context.getPerfMeasure('fixUserProfile');
  };
};
