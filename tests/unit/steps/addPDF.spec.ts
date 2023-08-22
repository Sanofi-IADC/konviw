import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import { HttpService } from '@nestjs/axios';
import addPDF from '../../../src/proxy-page/steps/addPDF';
import { createModuleRefForStep } from './utils';
import { confluenceMockServiceFactory } from '../mocks/confluenceService';

describe('ConfluenceProxy / fixConfluenceSpace', () => {
  let context: ContextService;
  let config: ConfigService;
  let http: HttpService;
  let input = '<html><head></head><body><div id="Content"><div class="office-container"><div id="media-viewer-content_test_pdf_3612" class="media-viewer-content" data-attachment-name="test.pdf"></div></div></div></body></html>';

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    http = moduleRef.get<HttpService>(HttpService);
    context.initPageContext('v2', 'XXX', '123456', 'dark');
  });

  it('should replace media viewer content by iframe', async () => {
    const step = addPDF(config, confluenceMockServiceFactory);

    context.setHtmlBody(input);
    await step(context);
    const expected = new RegExp('<html><head></head><body><div id=\"Content\"><div id=\"Content\"><div class=\"office-container\"><iframe src=\"data:application/pdf;base64.*\" width=\"800px\" height=\"400px\"></iframe></div></div></div></body></html>');
    expect(context.getHtmlBody()).toMatch(expected);
  });
});
