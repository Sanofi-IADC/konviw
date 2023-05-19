import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import { HttpService } from '@nestjs/axios';
import fixConfluenceSpace from '../../../src/proxy-page/steps/fixConfluenceSpace';
import { createModuleRefForStep } from './utils';
import { ConfluenceService } from '../../../src/confluence/confluence.service';
import { confluenceServiceMock } from '../mocks/confluenceService';

describe('ConfluenceProxy / fixConfluenceSpace', () => {
  let context: ContextService;
  let config: ConfigService;
  let http: HttpService;
  let input = '<html><head></head><body><div id="Content" class="fullWidth"><p><a href="/wiki/spaces/konviw">https://sanofi.atlassian.net/wiki/spaces/konviw</a> </p></div></body></html>';

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    http = moduleRef.get<HttpService>(HttpService);
    context.initPageContext('XXX', '123456', 'dark');
  });

  it('should replace confluence space icon', async () => {
    const step = fixConfluenceSpace(config, confluenceServiceMock as unknown as ConfluenceService);
    context.setHtmlBody(input);
    await step(context);
    const expected = '<img class="confluence-space-icon" src="https://test.atlassian.net/wiki/download/attachments/63859916803/konviw?version=1&amp;modificationDate=1664237784553&amp;cacheVersion=1&amp;api=v2">';
    expect(context.getHtmlBody()).toContain(expected);
  });

  it('should replace homepage for confluence page with id', async () => {
    const step = fixConfluenceSpace(config, confluenceServiceMock as unknown as ConfluenceService);
    context.setHtmlBody(input);
    await step(context);
    const expected = '<a class="confluence-space" href="/wiki/spaces/konviw/pages/63862669800">';
    expect(context.getHtmlBody()).toContain(expected);
  });
});
