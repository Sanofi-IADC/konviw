import fixCode from '../../../src/proxy-page/steps/fixCode';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / fixCode', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'XXX', '123456', 'dark');
  });

  it('should wrap code with <pre><code>', () => {
    const step = fixCode();
    context.setHtmlBody(
      '<html><head></head><body>' +
        '<pre class="syntaxhighlighter-pre">...</pre>' +
        '</body></html>',
    );
    step(context);
    expect(context.getHtmlBody()).toEqual(
      '<html><head></head><body>' +
        '<div id="Content"><pre><code>' +
        '...' +
        '</code></pre></div>' +
        '</body></html>',
    );
  });
});
