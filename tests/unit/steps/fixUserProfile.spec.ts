import { ContextService } from '../../../src/context/context.service';
import fixUserProfile from '../../../src/proxy-page/steps/fixUserProfile';
import { createModuleRefForStep } from './utils';

const example =
  `<html><head></head><body>` +
  `<div class="profile-macro conf-macro output-block" data-hasbody="false" data-macro-name="profile" data-macro-id="0a630fd2-588b-4147-a554-0dd20fc48c89" data-layout="default">` +
  `<div class="vcard"><a class="userLogoLink" data-username="5da80c30f273020c44682e47" data-account-id="5da80c30f273020c44682e47" href="/cpv/wiki/people/5da80c30f273020c44682e47">` +
  `<img class="userLogo logo" src="/cpv/wiki/aa-avatar/5da80c30f273020c44682e47" alt="User icon: 5da80c30f273020c44682e47" title="5da80c30f273020c44682e47"></a>` +
  `<div class="values"><div><a href="/cpv/wiki/people/5da80c30f273020c44682e47" class="url fn confluence-userlink" data-account-id="5da80c30f273020c44682e47">Aymeric Douyere</a></div>` +
  `<a href="mailto:aymeric.douyere@sanofi.com" title="Send Email to Aymeric Douyere" class="email">aymeric.douyere@sanofi.com</a>` +
  `</div></div></div>` +
  `<div class="profile-macro conf-macro output-block" data-hasbody="false" data-macro-name="profile" data-macro-id="5e5ff8b9-75dd-4d9c-99bc-1fcde85a5023" data-layout="default">` +
  `<div class="vcard"><a class="userLogoLink" data-username="5e282026c55f580c9fc9bc89" data-account-id="5e282026c55f580c9fc9bc89" href="/cpv/wiki/people/5e282026c55f580c9fc9bc89">` +
  `<img class="userLogo logo" src="/cpv/wiki/aa-avatar/5e282026c55f580c9fc9bc89" alt="User icon: 5e282026c55f580c9fc9bc89" title="5e282026c55f580c9fc9bc89"></a>` +
  `<div class="values"><div><a href="/cpv/wiki/people/5e282026c55f580c9fc9bc89" class="url fn confluence-userlink" data-account-id="5e282026c55f580c9fc9bc89">Khaoula Chaieb-ext</a></div>` +
  `<a href="mailto:khaoula.chaieb-ext@sanofi.com" title="Send Email to Khaoula Chaieb-ext" class="email">khaoula.chaieb-ext@sanofi.com</a>` +
  `</div></div></div></body></html>`;

const expected =
  `<html><head></head><body><div id="Content">` +
  `<div class="vcard"><img class="userLogo logo" src="/cpv/wiki/aa-avatar/5da80c30f273020c44682e47" alt="User icon: 5da80c30f273020c44682e47" title="5da80c30f273020c44682e47">` +
  `<div class="values"><div>Aymeric Douyere</div><a href="mailto:aymeric.douyere@sanofi.com" class="email">aymeric.douyere@sanofi.com</a></div></div>` +
  `<div class="vcard"><img class="userLogo logo" src="/cpv/wiki/aa-avatar/5e282026c55f580c9fc9bc89" alt="User icon: 5e282026c55f580c9fc9bc89" title="5e282026c55f580c9fc9bc89">` +
  `<div class="values"><div>Khaoula Chaieb-ext</div><a href="mailto:khaoula.chaieb-ext@sanofi.com" class="email">khaoula.chaieb-ext@sanofi.com</a></div></div>` +
  `</div></body></html>`;

describe('ConfluenceProxy / fixUserProfile', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);

    context.initPageContext('XXX', '123456', 'dark');
  });

  it('User Profiles fixed', () => {
    const step = fixUserProfile();
    context.setHtmlBody(example);
    step(context);
    expect(context.getHtmlBody()).toEqual(expected);
  });
});
