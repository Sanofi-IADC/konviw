import fixColgroupWidth from '../../../src/proxy-page/steps/fixColgroupWidth';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / fixColgroupWidth', () => {
  let context: ContextService;

  const step = fixColgroupWidth();

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.Init('XXX', '123456', 'dark');
    context.setHtmlBody('<html><head></head><body></body></html>');
  });

  it('should not convert column width to proportional percentage', () => {
    const colGroup = '<table><colgroup><col style="width: 224.0px;"/><col style="width: 224.0px;"/><col style="width: 224.0px;"/><col style="width: 224.0px;"/></colgroup></table>';
    context.setHtmlBody(colGroup);
    expect(context.getHtmlBody()).toContain('width: 224.0px;');
    step(context);
    expect(context.getHtmlBody()).toContain('width: 224.0px;');
  });


  it('should convert column width to proportional percentage', () => {
    const colGroup = '<table><colgroup><col style="width: 224.0px;"/><col style="width: 224.0px;"/><col style="width: 224.0px;"/><col style="width: 224.0px;"/><col style="width: 224.0px;"/></colgroup></table>';
    context.setHtmlBody(colGroup);
    expect(context.getHtmlBody()).toContain('width: 224.0px');
    step(context);
    expect(context.getHtmlBody()).not.toContain('width: 224.0px');
    expect(context.getHtmlBody()).toContain('width: 20%;');
  });
  

})