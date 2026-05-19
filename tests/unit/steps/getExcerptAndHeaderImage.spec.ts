import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import { ConfluenceService } from '../../../src/confluence/confluence.service';
import getExcerptAndHeaderImage from '../../../src/proxy-api/steps/getExcerptAndHeaderImage';
import { createModuleRefForStep } from './utils';

const FAILURE_TEXT = 'Failed to load the diagram preview image';

const buildFailureWarning = (pageId: string, classes = '') => `
  <div class="confluence-information-macro confluence-information-macro-warning conf-macro output-block conf-macro output-inline ${classes}"
       data-hasbody="true" data-macro-name="excerpt">
    <span class="aui-icon aui-icon-small aui-iconfont-error confluence-information-macro-icon"> </span>
    <div class="confluence-information-macro-body">
      <p>Failed to load the diagram preview image.</p>
      <p>Authentication Required</p>
      <p>Page ID: ${pageId}</p>
    </div>
  </div>`;

describe('ConfluenceProxy / getExcerptAndHeaderImage (drawio failure scrubbing)', () => {
  const pageId = '63881347657';
  let context: ContextService;
  let config: ConfigService;
  let confluence: ConfluenceService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    // ConfluenceService isn't registered in createModuleRefForStep, but the
    // step only invokes it when there is a non-URL header image. We pass a
    // stub instead of bringing the full module up.
    confluence = {
      getAttachments: jest.fn(),
    } as unknown as ConfluenceService;
    context.initPageContext('v2', 'XXX', pageId, 'dark');
  });

  it('returns a scrubbed excerpt when the excerpt macro IS the drawio failure warning', async () => {
    context.setHtmlBody(`
      <html><body>
        <p>Real body summary that should survive scrubbing.</p>
        ${buildFailureWarning(pageId)}
      </body></html>
    `);

    await getExcerptAndHeaderImage(config, confluence)(context);

    expect(context.getExcerpt()).not.toContain(FAILURE_TEXT);
    expect(context.getExcerpt()).not.toContain('Authentication Required');
    expect(context.getExcerpt()).not.toMatch(/Page ID:\s*\d+/);
    // Falls back to the body text which is also scrubbed of the failure
    // pattern; some real body content remains.
    expect(context.getExcerpt()).toContain('Real body summary');
  });

  it('strips the drawio failure warning when nested inside a richer excerpt macro', async () => {
    context.setHtmlBody(`
      <html><body>
        <div class="conf-macro output-inline" data-macro-name="excerpt">
          <p>Useful summary about the page.</p>
          ${buildFailureWarning(pageId)}
          <p>More summary text.</p>
        </div>
      </body></html>
    `);

    await getExcerptAndHeaderImage(config, confluence)(context);

    expect(context.getExcerpt()).not.toContain(FAILURE_TEXT);
    expect(context.getExcerpt()).toContain('Useful summary');
    expect(context.getExcerpt()).toContain('More summary text');
  });

  it('strips the drawio failure pattern from the body-text fallback when no excerpt macro is present', async () => {
    context.setHtmlBody(`
      <html><body>
        <p>Some real body text appears here.</p>
        ${buildFailureWarning(pageId)}
      </body></html>
    `);

    await getExcerptAndHeaderImage(config, confluence)(context);

    expect(context.getExcerpt()).not.toContain(FAILURE_TEXT);
    expect(context.getExcerpt()).toContain('Some real body text');
  });

  it('does not modify the cheerio body when scrubbing the excerpt (fixDrawio still needs the warning)', async () => {
    context.setHtmlBody(`
      <html><body>
        <div class="conf-macro output-inline" data-macro-name="excerpt">
          <p>Useful summary.</p>
          ${buildFailureWarning(pageId)}
        </div>
      </body></html>
    `);

    await getExcerptAndHeaderImage(config, confluence)(context);

    // Body still carries the warning macro for fixDrawio to replace.
    expect(context.getHtmlBody()).toContain(FAILURE_TEXT);
  });

  it('leaves a normal excerpt untouched', async () => {
    context.setHtmlBody(`
      <html><body>
        <div class="conf-macro output-inline" data-macro-name="excerpt">
          <p>This is a perfectly normal page summary.</p>
        </div>
      </body></html>
    `);

    await getExcerptAndHeaderImage(config, confluence)(context);

    expect(context.getExcerpt()).toContain('This is a perfectly normal page summary');
  });
});
