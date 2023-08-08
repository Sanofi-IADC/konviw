import fixImageSize from '../../../src/proxy-page/steps/fixImageSize';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / fixImageSize', () => {
  let context: ContextService;
  const step = fixImageSize();

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'XXX', '123456', 'dark');
    context.setHtmlBody('<html><head></head><body></body></html>');
  });

  it('should add a width attribute for img tag', () => {
    const imgTagWithoutWidth =
      '<img id = "imgId1" class="image-center" src="" data-height="291" data-width="289">';
    context.setHtmlBody(imgTagWithoutWidth);
    step(context);
    expect(context.getHtmlBody()).toContain('width="289"');
    expect(context.getHtmlBody()).toContain('data-width="289"');
  });

  it('should not add a width attribute for img with width', () => {
    const imgTagWithWidth =
      '<img id = "imgId2" class="image-center" width="300" src="" data-height="291" data-width="289">';
    context.setHtmlBody(imgTagWithWidth);
    step(context);
    expect(context.getHtmlBody()).toContain('width="300"');
    expect(context.getHtmlBody()).toContain('data-width="289"');
  });

  it('should not add a width attribute for img whithout data-width', () => {
    const imgTag = '<img id = "imgId3" class="image-center" src="">';
    context.setHtmlBody(imgTag);
    expect(context.getHtmlBody()).not.toContain('data-width');
    expect(context.getHtmlBody()).not.toContain('width');
    step(context);
    expect(context.getHtmlBody()).not.toContain('data-width');
    expect(context.getHtmlBody()).not.toContain('width');
  });
});
