import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';
import fixRecentlyUpdated from '../../../src/proxy-page/steps/fixRecentlyUpdated';

describe('ConfluenceProxy / fixRecentlyUpdated', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'XXX', '123456', 'dark');
  });

  it('should remove hidden parameters and the Show More link', () => {
    const step = fixRecentlyUpdated();
    const example =
      '<html><head></head><body>' +
      '<div class="recently-updated">' +
      '<div class="hidden parameters"></div>' +
      '<div class="results-container">' +
      '<div class="more-link-container"><a class="more-link" href="URL">Show More</a>' +
      '</div></div></div>' +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected =
      '<html><head></head><body>' +
      '<div id="Content">' +
      '<div class="recently-updated">' +
      '<div class="results-container">' +
      '</div></div>' +
      '</div>' +
      '</body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });
});
