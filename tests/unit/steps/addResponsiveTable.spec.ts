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

  it('should add data-column-id from th to each td', () => {
    context.setHtmlBody('<html><head></head><body><div id="Content"><h1 class="titlePage"> Demo table</h1><div class="table-wrap"><table data-layout="default" data-local-id="777e232d-5840-46a9-af22-7097487ec295" class="confluenceTable">'+
    '<colgroup><col style="width: 226.67px;"><col style="width: 226.67px;"><col style="width: 226.67px;"></colgroup><tbody><tr><th class="confluenceTh"><p><strong>A</strong></p></th><th class="confluenceTh"><p><strong>B</strong></p></th>'+
    '<th class="confluenceTh"><p><strong>C</strong></p></th></tr><tr><td class="confluenceTd" data-column-id="A"><p>Test</p></td><td class="confluenceTd" data-column-id="B"><p>Test</p></td><td class="confluenceTd" data-column-id="C"><p>Test</p>'
    +'</td></tr><tr><td class="confluenceTd" data-column-id="A"><p>Test</p></td><td class="confluenceTd" data-column-id="B"><p>Test</p></td><td class="confluenceTd" data-column-id="C"><p>Test</p></td></tr></tbody></table></div><p></p></div><script defer="" src="https://cdn.jsdelivr.net/npm/apexcharts"></body></html>');
    step(context);
    console.log(context.getHtmlBody());
    expect(context.getHtmlBody()).toEqual(
        '<html><head></head><body><div id=\"Content\"><div id=\"Content\"><h1 class=\"titlePage\"> Demo table</h1><div class=\"table-wrap\">'+
        '<table data-layout=\"default\" data-local-id=\"777e232d-5840-46a9-af22-7097487ec295\" class=\"confluenceTable\"><colgroup><col style=\"width: 226.67px;\">'+
        '<col style=\"width: 226.67px;\"><col style=\"width: 226.67px;\"></colgroup><tbody><tr><th class=\"confluenceTh\"><p><strong>A</strong></p></th><th class=\"confluenceTh\"><p><strong>B</strong></p></th><th class=\"confluenceTh\">'+
        '<p><strong>C</strong></p></th></tr><tr><td class=\"confluenceTd\" data-column-id=\"A\"><p>Test</p></td><td class=\"confluenceTd\" data-column-id=\"B\"><p>Test</p></td><td class=\"confluenceTd\" data-column-id=\"C\"><p>Test</p></td>'+
        '</tr><tr><td class=\"confluenceTd\" data-column-id=\"A\">'+
        '<p>Test</p></td><td class=\"confluenceTd\" data-column-id=\"B\"><p>Test</p></td><td class=\"confluenceTd\" data-column-id=\"C\"><p>Test</p></td></tr></tbody></table></div><p></p>'+
        '</div><script defer=\"\" src=\"https://cdn.jsdelivr.net/npm/apexcharts\"></body></html></script></div></body></html>'
    );
  });
});
