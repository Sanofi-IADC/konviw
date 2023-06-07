import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import { Step } from '../../../src/proxy-page/proxy-page.step';
import addResponsiveTable from '../../../src/proxy-page/steps/addTableResponsive';
import { createModuleRefForStep } from './utils';

describe('Confluence Proxy / addTheme', () => {
  let context: ContextService;
  let step: Step;

  beforeEach(async () => {
    step = addResponsiveTable();
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
  });

  it('should add data-column-id from th to each td (column headers)', () => {
    context.setHtmlBody('<html><head></head><body><div id="Content"><h1 class="titlePage"> Demo table</h1><div class="table-wrap"><table data-layout="default" data-local-id="777e232d-5840-46a9-af22-7097487ec295" class="confluenceTable">'+
    '<colgroup><col><col><col></colgroup>'+
    '<tbody><tr><th><p><strong>A</strong></p></th><th><p><strong>B</strong></p></th><th><p><strong>C</strong></p>'+
    '</th></tr><tr><td><p>Test1</p></td><td><p>Test2</p></td><td><p>Test3</p>'+
    '</td></tr><tr><td><p>Test4</p></td><td><p>Test5</p></td><td><p>Test6</p></td></tr>'+
    '</tbody></table></div><p></p></div></body></html>');
    step(context);
    expect(context.getHtmlBody()).toEqual('<html><head></head><body><div id=\"Content\"><div id=\"Content\"><h1 class=\"titlePage\"> Demo table</h1><div class=\"table-wrap\">'+
    '<table data-layout=\"default\" data-local-id=\"777e232d-5840-46a9-af22-7097487ec295\" class=\"confluenceTable\"><colgroup><col><col><col></colgroup>'+
    '<tbody><tr><th><p><strong>A</strong></p></th><th><p><strong>B</strong></p></th><th><p><strong>C</strong></p></th></tr>'+
    '<tr><td data-column-id=\"A\"><p>Test1</p></td><td data-column-id=\"B\"><p>Test2</p></td><td data-column-id=\"C\"><p>Test3</p></td></tr>'+
    '<tr><td data-column-id=\"A\"><p>Test4</p></td><td data-column-id=\"B\"><p>Test5</p></td><td data-column-id=\"C\"><p>Test6</p></td></tr></tbody>'+
    '</table></div><p></p></div></div></body></html>'
        
    );
  });
  it('should add data-row-id from th to each td(row headers)', () => {
    context.setHtmlBody('<html><head></head><body><div id="Content"><h1 class="titlePage"> Demo table</h1><div class="table-wrap"><table data-layout="default" data-local-id="777e232d-5840-46a9-af22-7097487ec295" class="confluenceTable">'+
    '<colgroup><col><col><col></colgroup>'+
    '<tbody><tr><th><p><strong>A</strong></p></th><td><p>Test1</p></td><td><p>Test2</p></td></tr>'+
    '<tr><th><p><strong>B</strong></p></th><td><p>Test3</p></td><td><p>Test4</p></td></tr>'+
    '</tbody></table></div><p></p></div></body></html>');
    step(context);
    expect(context.getHtmlBody()).toEqual('<html><head></head><body><div id=\"Content\"><div id=\"Content\"><h1 class=\"titlePage\"> Demo table</h1><div class=\"table-wrap\">'+
    '<table data-layout=\"default\" data-local-id=\"777e232d-5840-46a9-af22-7097487ec295\" class=\"confluenceTable\"><colgroup><col><col><col></colgroup>'+
    '<tbody><tr><th><p><strong>A</strong></p></th><td data-lign-id=\"A\"><p>Test1</p></td><td data-lign-id=\"A\"><p>Test2</p></td></tr>'+
    '<tr><th><p><strong>B</strong></p></th><td data-lign-id=\"B\"><p>Test3</p></td><td data-lign-id=\"B\"><p>Test4</p></td></tr></tbody>'+
    '</table></div><p></p></div></div></body></html>')
  });
  it('should add data-row-id and data-columnn-id from th to each td(row headers/column headers)', () => {
    context.setHtmlBody('<html><head></head><body><div id="Content"><h1 class="titlePage"> Demo table</h1><div class="table-wrap"><table data-layout="default" data-local-id="777e232d-5840-46a9-af22-7097487ec295" class="confluenceTable">'+
    '<colgroup><col><col><col></colgroup>'+
    '<tbody><tr><th><p><strong>1</strong></p></th><th><p><strong>2</strong></p></th><th><p><strong>3</strong></p></th></tr>'+
    '<tr><th><p><strong>A</strong></p></th><td><p>Test1</p></td><td><p>Test2</p></td>'+
    '</tr><tr><th><p><strong>B</strong></p></th><td><p>Test3</p></td><td><p>Test4</p></td></tr>'+
    '</tbody></table></div><p></p></div></body></html>');
    step(context);

    expect(context.getHtmlBody()).toEqual('<html><head></head><body><div id=\"Content\"><div id=\"Content\"><h1 class=\"titlePage\"> Demo table</h1><div class=\"table-wrap\">'+
    '<table data-layout=\"default\" data-local-id=\"777e232d-5840-46a9-af22-7097487ec295\" class=\"confluenceTable\"><colgroup><col><col><col></colgroup>'+
    '<tbody><tr><th><p><strong>1</strong></p></th><th><p><strong>2</strong></p></th><th><p><strong>3</strong></p></th></tr>'+
    '<tr><th><p><strong>A</strong></p></th><td data-column-id=\"2\" data-lign-id=\"A\"><p>Test1</p></td><td data-column-id=\"3\" data-lign-id=\"A\"><p>Test2</p></td></tr>'+
    '<tr><th><p><strong>B</strong></p></th><td data-column-id=\"2\" data-lign-id=\"B\"><p>Test3</p></td><td data-column-id=\"3\" data-lign-id=\"B\"><p>Test4</p></td></tr></tbody>'+
    '</table></div><p></p></div></div></body></html>'
    );
  });
});
