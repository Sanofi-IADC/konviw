import addZoom from '../../../src/proxy-page/steps/addZoom';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / addZoom', () => {
  let context: ContextService;
  const step = addZoom();

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'XXX', '123456', 'dark');
    context.setHtmlBody('<html><head></head><body></body></html>');
  });

  it('should add the class konviw-image-zoom-effect to trigger zoom effect', () => {
    const imgTagWithoutWidth =
      '<img id = "imgId1" class="confluence-embedded-image image-center" alt="(zoom)" src="" data-height="291" data-width="289">';
    context.setHtmlBody(imgTagWithoutWidth);
    step(context);
    expect(context.getHtmlBody()).toContain('konviw-image-zoom-effect');
  });

  it('should not add zoom effect to the img tag', () => {
    const imgTagWithoutWidth =
      '<img id = "imgId1" class="confluence-embedded-image image-center" alt="this will not zoom" src="" data-height="291" data-width="289">';
    context.setHtmlBody(imgTagWithoutWidth);
    step(context);
    expect(context.getHtmlBody()).not.toContain('konviw-image-zoom-effect');
  });

});
