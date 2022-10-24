import fixAddNewSlides from '../../../src/proxy-page/steps/fixAddNewSlides';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / fixAddNewSlies', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('XXX', '123456', 'dark');
  });

  it('should remove content from slideSettings macro name', () => {
    const step = fixAddNewSlides();
    context.setHtmlBody(
      '<html><head></head><body>' +
        '<div class="conf-macro" data-macro-name="slideSettings">Settings</div>' +
        '</body></html>',
    );
    step(context);
    expect(context.getHtmlBody()).toEqual('<html><head></head><body><div id=\"Content\"></div></body></html>');
  });
});
