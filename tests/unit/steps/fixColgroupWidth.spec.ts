import * as cheerio from 'cheerio';
import fixColgroupWidth from '../../../src/proxy-page/steps/fixColGroupWidth';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / fixColGroupWidth', () => {
  let context: ContextService;

  const step = fixColgroupWidth();

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'XXX', '123456', 'dark');
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

  it('should convert a nested table colgroup from px to proportional percentage % so it fits its cell', () => {
    context.setHtmlBody('<html><head></head><body>'+
    '<table data-layout="default" class="confluenceTable"><colgroup><col style="width: 500.0px;"/><col style="width: 500.0px;"/></colgroup>'+
    '<tbody><tr>'+
    '<td class="confluenceTd"><table class="confluenceTable"><colgroup><col style="width: 300.0px;"/><col style="width: 300.0px;"/></colgroup>'+
    '<tbody><tr><td><p>n1</p></td><td><p>n2</p></td></tr></tbody></table></td>'+
    '<td class="confluenceTd"><p>right</p></td>'+
    '</tr></tbody></table>'+
    '</body></html>');
    step(context);

    const $ = cheerio.load(context.getHtmlBody());
    const nestedCols = $('td.confluenceTd table.confluenceTable > colgroup > col');
    expect(nestedCols.length).toBe(2);
    nestedCols.each((_i, col) => {
      expect($(col).attr('style')).toBe('width: 50%;');
    });
  });

})
