import { ContextService } from '../../../src/context/context.service';
import addLibrariesCSS from '../../../src/proxy-page/steps/addLibrariesCSS';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / addLibrariesCSS', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
  });

  it('should add highlight.js css', () => {
    context.initPageContext('XXX', '123456', 'dark');
    const step = addLibrariesCSS();
    context.setHtmlBody('<html><head></head><body></body></html>');
    step(context);
    expect(context.getHtmlBody()).toContain(
      `<html><head><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js`,
    );
  });
});
