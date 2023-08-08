import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import fixSVG from '../../../src/proxy-page/steps/fixSVG';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / fixLinks', () => {
  let context: ContextService;
  let config: ConfigService;
  let webBasePath;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    webBasePath = config.get('web.absoluteBasePath');

    context.initPageContext('v2', 'XXX', '123456', 'dark');
  });

  it('should replace the img src, width and class', () => {
    const step = fixSVG(config);
    const example =
      '<html><head></head><body>' +
      '<img data-encoded-xml="%3Cac%3Aimage+ac%3Aalign%3D%22center%22+ac%3Alayout%3D%22center%22+ac%3Aoriginal-height%3D%22512%22+ac%3Aoriginal-width%3D%22512%22+ac%3Awidth%3D%22340%22%3E%3Cri%3Aattachment+ri%3Afilename%3D%22cloud-outline.svg%22+ri%3Aversion-at-save%3D%221%22+%2F%3E%3C%2Fac%3Aimage%3E">' +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected =
      '<html><head></head><body><div id="Content">' +
      `<img src="${webBasePath}/wiki/download/attachments/123456/cloud-outline.svg" width="340" class="image-center">` +   
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  })
});