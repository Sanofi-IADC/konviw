import { ContextService } from '../../../src/context/context.service';
import addLibrariesJS from '../../../src/proxy-page/steps/addLibrariesJS';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / addLibrariesJS', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContextRestAPIv2('XXX', '123456', 'dark');
    const step = addLibrariesJS();
    context.setHtmlBody('<html><head></head><body></body></html>');
    step(context);
  });

  it('should add and call highlight.js JS  library', () => {
    expect(context.getHtmlBody()).toContain(
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js',
    );
    expect(context.getHtmlBody()).toContain('hljs.highlightAll();');
  });

  it('should add and call zooming JS  library', () => {
    expect(context.getHtmlBody()).toContain(
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/zooming',
    );
    expect(context.getHtmlBody()).toContain('zooming.listen(');
  });

  it('should add iFrame resizer JS library and call sendMessage', () => {
    expect(context.getHtmlBody()).toContain(
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer',
    );
    expect(context.getHtmlBody()).toContain(
      'window.parentIFrame.sendMessage(konviwMessage)',
    );
  });
});