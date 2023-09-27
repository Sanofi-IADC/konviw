import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';
import fixProfilePicture from '../../../src/proxy-page/steps/fixProfilePicture';

describe('ConfluenceProxy / fixProfilePicture', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'XXX', '123456', 'dark');
  });

  it('should remove profile picture', () => {
    const step = fixProfilePicture();
    const example =
      '<html><head></head><body>' +
      '<div class="cell aside" data-type="aside">' +
      '<div class="innerCell">' +
      '<div class="error">' +
      "Error rendering macro 'profile-picture' : No user parameter specified</div></div>" +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected = '<html><head></head><body><div id="Content"><div class="cell aside" data-type="aside"><div class="innerCell"></div></div></div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should not remove profile picture', () => {
    const step = fixProfilePicture();
    const example =
      '<html><head></head><body>' +
      '<div class="cell aside" data-type="aside">' +
      '<p><strong>Speaker first, lastname</strong> (<a href="https://test.atlassian.net/wiki/spaces/~287909685/pages/256147998" rel="nofollow">Personal page</a>)</p><p>Short Bio</p></div>' +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected =
      '<html><head></head><body><div id="Content">' +
      '<div class="cell aside" data-type="aside">' +
      '<p><strong>Speaker first, lastname</strong> (<a href="https://test.atlassian.net/wiki/spaces/~287909685/pages/256147998" rel="nofollow">Personal page</a>)</p><p>Short Bio</p></div>' +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });
});
