import * as cheerio from 'cheerio';
import { ContextService } from '../../../src/context/context.service';
import { Step } from '../../../src/proxy-page/proxy-page.step';
import fixTableSize from '../../../src/proxy-page/steps/fixTableSize';
import { createModuleRefForStep } from './utils';

describe('Confluence Proxy / fixTableSize', () => {
  let context: ContextService;
  let step: Step;

  beforeEach(async () => {
    step = fixTableSize();
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
  });

  it('should add style with width equal to attribute data-table-width', () => {
    context.setHtmlBody('<html><head></head><body><h1 class="titlePage"> Demo table</h1>'+
    '<div class="table-wrap">'+
    '<table data-table-width="750" data-layout="default" class="confluenceTable">'+
    '<colgroup><col><col><col></colgroup>'+
    '<tbody><tr><th><p><strong>A</strong></p></th><th><p><strong>B</strong></p></th><th><p><strong>C</strong></p>'+
    '</th></tr><tr><td><p>Test1</p></td><td><p>Test2</p></td><td><p>Test3</p>'+
    '</td></tr><tr><td><p>Test4</p></td><td><p>Test5</p></td><td><p>Test6</p></td></tr>'+
    '</tbody></table></div><p></p></body></html>');
    step(context);
    expect(context.getHtmlBody()).toEqual('<html><head></head><body><div id="Content"><h1 class="titlePage"> Demo table</h1>'+
    '<div class="table-wrap">'+
    '<table data-table-width="750" data-layout="default" class="confluenceTable" style="width: 750;" data-konviw-table-size="small">'+
    '<colgroup><col><col><col></colgroup>'+
    '<tbody><tr><th><p><strong>A</strong></p></th><th><p><strong>B</strong></p></th><th><p><strong>C</strong></p>'+
    '</th></tr><tr><td><p>Test1</p></td><td><p>Test2</p></td><td><p>Test3</p>'+
    '</td></tr><tr><td><p>Test4</p></td><td><p>Test5</p></td><td><p>Test6</p></td></tr>'+
    '</tbody></table></div><p></p></div></body></html>');
  });

  it('should add style with width 100% if attribute data-table-width is > 1400px', () => {
    context.setHtmlBody('<html><head></head><body><h1 class="titlePage"> Demo table</h1>'+
    '<div class="table-wrap">'+
    '<table data-table-width="1500" data-layout="default" class="confluenceTable">'+
    '<colgroup><col><col><col></colgroup>'+
    '<tbody><tr><th><p><strong>A</strong></p></th><th><p><strong>B</strong></p></th><th><p><strong>C</strong></p>'+
    '</th></tr><tr><td><p>Test1</p></td><td><p>Test2</p></td><td><p>Test3</p>'+
    '</td></tr><tr><td><p>Test4</p></td><td><p>Test5</p></td><td><p>Test6</p></td></tr>'+
    '</tbody></table></div><p></p></body></html>');
    step(context);
    expect(context.getHtmlBody()).toEqual('<html><head></head><body><div id="Content"><h1 class="titlePage"> Demo table</h1>'+
    '<div class="table-wrap">'+
    '<table data-table-width="1500" data-layout="default" class="confluenceTable" data-konviw-table-size="large">'+
    '<colgroup><col><col><col></colgroup>'+
    '<tbody><tr><th><p><strong>A</strong></p></th><th><p><strong>B</strong></p></th><th><p><strong>C</strong></p>'+
    '</th></tr><tr><td><p>Test1</p></td><td><p>Test2</p></td><td><p>Test3</p>'+
    '</td></tr><tr><td><p>Test4</p></td><td><p>Test5</p></td><td><p>Test6</p></td></tr>'+
    '</tbody></table></div><p></p></div></body></html>');
  });

  it('should not size a nested table (one level deep)', () => {
    context.setHtmlBody('<html><head></head><body>'+
    '<div class="table-wrap">'+
    '<table data-table-width="1500" data-layout="default" class="confluenceTable"><colgroup><col><col></colgroup>'+
    '<tbody><tr>'+
    '<td class="confluenceTd"><div class="table-wrap"><table data-table-width="750" class="confluenceTable"><colgroup><col></colgroup>'+
    '<tbody><tr><td><p>nested</p></td></tr></tbody></table></div></td>'+
    '<td class="confluenceTd"><p>right</p></td>'+
    '</tr></tbody></table></div></body></html>');
    step(context);

    const $ = cheerio.load(context.getHtmlBody());
    const outerTable = $('table.confluenceTable').first();
    const nestedTable = outerTable.find('table.confluenceTable').first();

    // The top-level table is still sized.
    expect(outerTable.attr('data-konviw-table-size')).toBe('large');

    // The nested table must be left untouched so it can fit its cell.
    expect(nestedTable.attr('data-konviw-table-size')).toBeUndefined();
    expect(nestedTable.attr('style')).toBeUndefined();
  });
});
