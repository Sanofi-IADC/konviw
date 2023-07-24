import { ContextService } from '../../../src/context/context.service';
import { Step } from '../../../src/proxy-page/proxy-page.step';
import addMessageLastSlide from '../../../src/proxy-page/steps/addMessageLastSlide';
import { createModuleRefForStep } from './utils';

describe('Confluence Proxy / addTheme', () => {
  let context: ContextService;
  let step: Step;

  beforeEach(async () => {
    step = addMessageLastSlide();
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
  });

  it('Add the last message', () => {
    context.setHtmlBody('<html><head></head><body><div id="Content"><section id="slides-logo"></section><div class="plugin-tabmeta-details conf-macro output-block"></div><div class="reveal"></div></div></body></html>');
    step(context);
    expect(context.getHtmlBody()).toContain('<section class="message"><a href="https://docs.sanofi.com/cpv/wiki/spaces/konviw/pages/63865589801?style=digital">Made with ❤️ Confluence and konviw</a></section>');
  });
  it('Add the last script', () => {
    context.setHtmlBody('<html><head></head><body><div id="Content"><section id="slides-logo"></section><div class="plugin-tabmeta-details conf-macro output-block"></div><div class="reveal"></div></div><script></script><script></script></body></html>');
    step(context);
    expect(context.getHtmlBody()).toContain('function updateMessageVisibility()');
  });
});
