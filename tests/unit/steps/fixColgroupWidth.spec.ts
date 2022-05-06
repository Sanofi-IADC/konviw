import fixColgroupWidth from '../../../src/proxy-page/steps/fixColGroupWidth';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / fixColGroupWidth', () => {
  let context: ContextService;

  const step = fixColgroupWidth();

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('XXX', '123456', 'dark');
    context.setHtmlBody('<html><head></head><body></body></html>');
  });

  it('should not convert column width from px to proportional percentage % when sum of colgroup column widths is less than 1000px', () => {
    const colGroup = '<table><colgroup><col style="width: 224.0px;"/><col style="width: 224.0px;"/><col style="width: 224.0px;"/><col style="width: 224.0px;"/></colgroup></table>';
    context.setHtmlBody(colGroup);
    expect(context.getHtmlBody()).toContain('width: 224.0px;');
    step(context);
    expect(context.getHtmlBody()).toContain('width: 224.0px;');
    expect(context.getHtmlBody()).not.toContain('width: 25%;');
  });

})
