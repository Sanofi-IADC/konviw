import delUnnecessaryCode from '../../../src/proxy-page/steps/delUnnecessaryCode';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';

const expected =
  `<html><head></head><body><div id="Content">` +
  `<h1 class="titlePage">CPV tests - drawio</h1><h1 id="CPVtests-drawio-NewDrawiochartcreatedinthispage">New Drawio chart created in this page</h1>` +
  `<div class="ap-container conf-macro output-block" id="ap-com.mxgraph.confluence.plugins.diagramly__drawio6258092762655211792" data-hasbody="false" data-macro-name="drawio" data-macro-id="6af0347a-cb79-4798-8f30-ce267012ab76" data-layout="default">` +
  `<div class="ap-content " id="embedded-com.mxgraph.confluence.plugins.diagramly__drawio6258092762655211792"></div></div>` +
  `<h1 id="CPVtests-drawio-Drawiochartincludedfromtherepository">Drawio chart included from the repository</h1><p></p><div class="ap-container conf-macro output-block" id="ap-com.mxgraph.confluence.plugins.diagramly__inc-drawio8122018541812106549" data-hasbody="false" data-macro-name="inc-drawio" data-macro-id="47a6af02-987f-49af-a2bb-b6d874a64554" data-layout="default">` +
  `<div class="ap-content " id="embedded-com.mxgraph.confluence.plugins.diagramly__inc-drawio8122018541812106549"></div></div>` +
  `<script>document.addEventListener('DOMContentLoaded', function () {new Zooming({}).listen('.img-zoomable');new Zooming({}).listen('.confluence-embedded-image')})</script><script>var coll = document.getElementsByClassName("expand-control");        var i;        for (i = 0; i < coll.length; i++) {          coll[i].addEventListener("click", function() {            this.classList.toggle("active");            var content = this.nextElementSibling;            if (content.style.display === "block") {              content.style.display = "none";            } else {              content.style.display = "block";            }          });        }</script>` +
  `</div></body></html>`;

describe('ConfluenceProxy / del unnecessary code', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);

    context.initPageContext('XXX', '123456', 'dark');
  });

  it('Remove CDATA blocks from Drawio ap-iframe-body-script', () => {
    const step = delUnnecessaryCode();
    const example =
      `<html><body>` +
      `<h1 class="titlePage">CPV tests - drawio</h1><h1 id="CPVtests-drawio-NewDrawiochartcreatedinthispage">New Drawio chart created in this page</h1>` +
      `<div class="ap-container conf-macro output-block" id="ap-com.mxgraph.confluence.plugins.diagramly__drawio6258092762655211792" data-hasbody="false" data-macro-name="drawio" data-macro-id="6af0347a-cb79-4798-8f30-ce267012ab76" data-layout="default">` +
      `<div class="ap-content " id="embedded-com.mxgraph.confluence.plugins.diagramly__drawio6258092762655211792"></div></div>` +
      `<h1 id="CPVtests-drawio-Drawiochartincludedfromtherepository">Drawio chart included from the repository</h1><p></p><div class="ap-container conf-macro output-block" id="ap-com.mxgraph.confluence.plugins.diagramly__inc-drawio8122018541812106549" data-hasbody="false" data-macro-name="inc-drawio" data-macro-id="47a6af02-987f-49af-a2bb-b6d874a64554" data-layout="default">` +
      `<div class="ap-content " id="embedded-com.mxgraph.confluence.plugins.diagramly__inc-drawio8122018541812106549"></div></div>` +
      `<script>document.addEventListener('DOMContentLoaded', function () {new Zooming({}).listen('.img-zoomable');new Zooming({}).listen('.confluence-embedded-image')})</script><script>var coll = document.getElementsByClassName("expand-control");        var i;        for (i = 0; i < coll.length; i++) {          coll[i].addEventListener("click", function() {            this.classList.toggle("active");            var content = this.nextElementSibling;            if (content.style.display === "block") {              content.style.display = "none";            } else {              content.style.display = "block";            }          });        }</script>` +
      `</body></html>`;
    context.setHtmlBody(example);
    step(context);
    expect(context.getHtmlBody()).toEqual(expected);
  });
});
