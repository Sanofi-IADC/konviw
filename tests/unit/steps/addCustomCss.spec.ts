import { ContextService } from '../../../src/context/context.service';
import { ConfigService } from '@nestjs/config';
import addCustomCss from '../../../src/proxy-page/steps/addCustomCss';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / addCustomCss', () => {
  let context: ContextService;
  let config: ConfigService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
  });

  it('should add custom CSS', () => {
    context.initPageContext('XXX', '123456', 'dark');
    const step = addCustomCss(config);
    const version = config.get('version');
    const basePath = config.get('web.basePath');
    context.setHtmlBody('<html><head></head><body></body></html>');
    step(context);
    expect(context.getHtmlBody()).toEqual(
      `<html><head><link rel="stylesheet" type="text/css" href="${basePath}/css/custom.css?cache=${version}"></head><body><div id="Content"></div></body></html>`,
    );
  });
});
