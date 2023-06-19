import { ContextService } from '../../../src/context/context.service';
import { Step } from '../../../src/proxy-page/proxy-page.step';
import addAuthorVersion from '../../../src/proxy-page/steps/addAuthorVersion';
import { createModuleRefForStep } from './utils';
import { Version } from '../../../src/context/context.interface';

describe('Confluence Proxy / addAuthorVersion', () => {
  let context: ContextService;
  let step: Step;

  beforeEach(async () => {
    step = addAuthorVersion();
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.setAuthor('Test');
    context.setAvatar('Test.jpg');
    const mockversion: Version = {
      versionNumber: 2,
      when: 'Test',
      modificationBy: {
        displayName: 'Test',
        email: 'Test@sanofi.com',
        profilePicture: 'Test.jpg',
      },
    };
    context.setLastVersion(mockversion);
  });

  it('should render author name and page version', () => {
    context.setType('title,author,version');
    context.setHtmlBody(
      '<html><head></head><body><div id="Content"><h1 class="titlePage"> Demo table</h1><h1>Test</h1><table><colgroup><col></colgroup><tbody><tr><th><h1>Test</h1></th></tr><tr><td><h1>Test</h1></td></tr></tbody></table><div>' +
        '</body></html>',
    );
    step(context);
    const htmlBody = context.getHtmlBody().trim();
    expect(htmlBody.includes(`<p class=\"author_text\">Creator: Test</p>`)).toBe(true);
    expect(htmlBody.includes(`<p class=\"author_text\">Page version: 2</p>`)).toBe(true);
  });

  it('should render only author name', () => {
    context.setType('title,author');
    context.setHtmlBody(
      '<html><head></head><body><div id="Content"><h1 class="titlePage"> Demo table</h1><h1>Test</h1><table><colgroup><col></colgroup><tbody><tr><th><h1>Test</h1></th></tr><tr><td><h1>Test</h1></td></tr></tbody></table><div>' +
        '</body></html>',
    );
    step(context);
    const htmlBody = context.getHtmlBody().trim();
    expect(htmlBody.includes(`<p class=\"author_text\">Creator: Test</p>`)).toBe(true);
    expect(htmlBody.includes(`<p class=\"author_text\">Page version: 2</p>`)).toBe(false);
  });

  it('should not render author name and page version', () => {
    context.setType('title');
    context.setHtmlBody(
      '<html><head></head><body><div id="Content"><h1 class="titlePage"> Demo table</h1><h1>Test</h1><table><colgroup><col></colgroup><tbody><tr><th><h1>Test</h1></th></tr><tr><td><h1>Test</h1></td></tr></tbody></table><div>' +
        '</body></html>',
    );
    step(context);
    const htmlBody = context.getHtmlBody().trim();
    expect(htmlBody.includes(`<p class=\"author_text\">Creator: Test</p>`)).toBe(false);
    expect(htmlBody.includes(`<p class=\"author_text\">Page version: 2</p>`)).toBe(false);
  });
});
