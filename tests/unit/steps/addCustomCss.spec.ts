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

    context.Init('XXX', '123456', 'dark');
  });

  it('should add custom CSS', () => {
    const step = addCustomCss(config);
    const version = config.get('version');
    const basePath = config.get('web.basePath');
    context.setHtmlBody(
      '<html><head><title>test</title><style default-inline-css="">/* confluence CSS */</style></head><body></body></html>',
    );
    step(context);
    expect(context.getHtmlBody()).toEqual(
      `<html><head><title>test</title><style default-inline-css="">/* confluence CSS */</style><link rel="stylesheet" type="text/css" href="${basePath}/css/custom.css?cache=${version}"><link href="${basePath}/css/all.min.css?cache=${version}" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"></head><body></body></html>`,
    );
  });
});
