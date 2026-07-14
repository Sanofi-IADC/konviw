import { Step } from '../../../src/proxy-page/proxy-page.step';
import { ContextService } from '../../../src/context/context.service';
import addTheme from '../../../src/proxy-page/steps/addTheme';
import { createModuleRefForStep } from './utils';

describe('Confluence Proxy / addTheme', () => {
  let context: ContextService;
  let step: Step;

  beforeEach(async () => {
    step = addTheme();
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
  });

  it('should set data-theme=dark on <html> for zero-flash paint', () => {
    context.initPageContext('v2', 'XXX', '123456', 'dark');
    context.setHtmlBody('<html><head></head><body>BODY CONTENT</body></html>');
    step(context);
    expect(context.getHtmlBody())
      .toEqual('<html data-theme="dark"><head><script>try{localStorage.setItem(\'theme\',\'dark\')}catch(e){}</script></head><body><div id="Content">BODY CONTENT</div></body></html>');
  });

  it('should set data-theme=light on <html> for zero-flash paint', () => {
    context.initPageContext('v2', 'XXX', '123456', 'light');
    context.setHtmlBody('<html><head></head><body>BODY CONTENT</body></html>');
    step(context);
    expect(context.getHtmlBody())
      .toEqual('<html data-theme="light"><head><script>try{localStorage.setItem(\'theme\',\'light\')}catch(e){}</script></head><body><div id="Content">BODY CONTENT</div></body></html>');
  });

  it('should inject a blocking head script resolving the theme when none is given', () => {
    context.initPageContext('v2', 'XXX', '123456', undefined as any);
    context.setHtmlBody('<html><head></head><body>BODY CONTENT</body></html>');
    step(context);
    const html = context.getHtmlBody();
    // No server-side attribute on <html> (preference is only known client-side)
    expect(html).not.toContain('data-theme="');
    // Blocking, non-deferred head script that resolves the theme before paint
    expect(html).toContain("localStorage.getItem('theme')");
    expect(html).toContain("document.documentElement.setAttribute('data-theme', theme)");
    expect(html).not.toContain('DOMContentLoaded');
    expect(html).not.toContain('type="module"');
  });
});
