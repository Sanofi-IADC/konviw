import { ContextService } from '../../../src/context/context.service';
import { ConfigService } from '@nestjs/config';
import { createModuleRefForStep } from '../steps/utils';
import * as fs from 'fs';

/**
 * An html context which each step should have things to fix/do
 */
const htmlContext =
  `<html><body><div id="Content" style="padding: 5px;">` +
  `<h1 class="titlePage">CPV tests - all</h1><h1 id="CPVtests-drawio-NewDrawiochartcreatedinthispage">New Drawio chart created in this page</h1>` +
  `<div class="ap-container conf-macro output-block" id="ap-com.mxgraph.confluence.plugins.diagramly__drawio6258092762655211792" data-hasbody="false" data-macro-name="drawio" data-macro-id="6af0347a-cb79-4798-8f30-ce267012ab76" data-layout="default">` +
  `<div class='ap-content ' id='embedded-com.mxgraph.confluence.plugins.diagramly__drawio6258092762655211792'/>` +
  `<script class="ap-iframe-body-script">//<![CDATA[  (function(){    var data = {    "addon_key":"com.mxgraph.confluence.plugins.diagramly",    "uniqueKey":"com.mxgraph.confluence.plugins.diagramly__drawio6258092762655211792",    "key":"drawio",     "moduleType":"dynamicContentMacros",      "moduleLocation":"content",         "cp":"/cpv/wiki",            "general":"",    "w":"",    "h":"",    "url":"https://confluence.draw.io/connect/confluence/viewer-1-4-8.html?ceoId=493027878&diagramName=Test+Styles+Content+Confluence.drawio&revision=1&width=1576.0000000000002&height=846.5&tbstyle=&simple=0&lbox=1&zoom=1&links=&owningPageId=473006389&displayName=Test+Styles+Content+Confluence.drawio&contentId=&custContentId=472941121&contentVer=1&inComment=0&aspect=&pCenter=0&xdm_e=https%3A%2F%2Fiadc.atlassian.net&xdm_c=channel-com.mxgraph.confluence.plugins.diagramly__drawio6258092762655211792&cp=%2Fwiki&xdm_deprecated_addon_key_do_not_use=com.mxgraph.confluence.plugins.diagramly&lic=active&cv=1.691.0",        "structuredContext": "{\"license\":{\"active\":true},\"confluence\":{\"macro\":{\"outputType\":\"display\",\"hash\":\"6af0347a-cb79-4798-8f30-ce267012ab76\",\"id\":\"6af0347a-cb79-4798-8f30-ce267012ab76\"},\"content\":{\"type\":\"page\",\"version\":\"1\",\"id\":\"493027878\"},\"space\":{\"key\":\"IADC\",\"id\":\"185466888\"}}}",    "contentClassifier":"content",    "productCtx":"{\"page.id\":\"493027878\",\"macro.hash\":\"6af0347a-cb79-4798-8f30-ce267012ab76\",\"page.type\":\"page\",\"simple\":\"0\",\"inComment\":\"0\",\": = | RAW | = :\":\"simple=0|zoom=1|inComment=0|custContentId=472941121|pageId=473006389|diagramDisplayName=Test Styles Content Confluence.drawio|lbox=1|contentVer=1|revision=1|baseUrl=https://iadc.atlassian.net/wiki|diagramName=Test Styles Content Confluence.drawio|pCenter=0|width=1576.0000000000002|links=|tbstyle=|height=846.5\",\"space.id\":\"185466888\",\"diagramDisplayName\":\"Test Styles Content Confluence.drawio\",\"diagramName\":\"Test Styles Content Confluence.drawio\",\"links\":\"\",\"tbstyle\":\"\",\"height\":\"846.5\",\"space.key\":\"IADC\",\"user.id\":\"5cb43c00675d991189b673e8\",\"content.version\":\"1\",\"page.title\":\"CPV tests - drawio\",\"zoom\":\"1\",\"macro.body\":\"\",\"custContentId\":\"472941121\",\"pageId\":\"473006389\",\"macro.truncated\":\"false\",\"lbox\":\"1\",\"content.type\":\"page\",\"output.type\":\"display\",\"contentVer\":\"1\",\"page.version\":\"1\",\"revision\":\"1\",\"user.key\":\"8a7f808a6d61ee43016d62fdeb7a0010\",\"baseUrl\":\"/cpv/wiki\",\"pCenter\":\"0\",\"content.id\":\"493027878\",\"width\":\"1576.0000000000002\",\"macro.id\":\"6af0347a-cb79-4798-8f30-ce267012ab76\"}",    "timeZone":"Europe/Berlin",    "origin":"https://confluence.draw.io",    "hostOrigin":"https://iadc.atlassian.net",    "sandbox":"allow-downloads allow-forms allow-modals allow-popups allow-scripts allow-same-origin allow-top-navigation-by-user-activation",        "apiMigrations": {        "gdpr": true    }};    if(window.AP && window.AP.subCreate) {      window._AP.appendConnectAddon(data);    } else {      require(['ac/create'], function(create){        create.appendConnectAddon(data);      });    }  }());//]]></script></div>` +
  `<h1 id="CPVtests-drawio-Drawiochartincludedfromtherepository">Drawio chart included from the repository</h1><p></p><div class="ap-container conf-macro output-block" id="ap-com.mxgraph.confluence.plugins.diagramly__inc-drawio8122018541812106549" data-hasbody="false" data-macro-name="inc-drawio" data-macro-id="47a6af02-987f-49af-a2bb-b6d874a64554" data-layout="default">` +
  `<div class="ap-content " id="embedded-com.mxgraph.confluence.plugins.diagramly__inc-drawio8122018541812106549"></div>` +
  '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4242/Hello+World">test</a>' +
  '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4343/Hello+World">test2</a>' +
  '<h1 id="Header1">Header 1</h1>' +
  '<h2 id="Header1.1">Header 1.1</h2>' +
  '<h3 id="Header1.1.1">Header 1.1.1</h3>' +
  '<h4 id="Header1.1.1.1">Header 1.1.1.1</h4>' +
  '<h5 id="Header1.1.1.1.1">Header 1.1.1.1.1</h5>' +
  '<h6 id="Header1.1.1.1.1.1">Header 1.1.1.1.1.1</h6>' +
  '<h2 id="Header1.2">Header 1.2</h2>' +
  '<h3 id="Header1.2.1">Header 1.2.1</h3>' +
  '<h3 id="Header1.2.2">Header 1.2.2</h3>' +
  '<h3 id="Header1.2.3">Header 1.2.3</h3>' +
  '<h1 id="Header2">Header 2</h1>' +
  '<h1 id="Header3">Header 3</h1>' +
  '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4242/Hello+World">test</a>' +
  '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4343/Hello+World">test2</a>' +
  '<span class="confluence-embedded-file-wrapper image-center-wrapper">' +
  `<video width="400" controls><source src="/cpv/wiki/download/attachments/473006389/DMDG%20SAP%20metadata.mp4?version=1" type="video/mp4"></video>` +
  `<a href="/cpv/wiki/download/attachments/473006389/DMDG%20SAP%20metadata.mp4?version=1">DMDG SAP metadata.mp4</a></span>` +
  `<script class="ap-iframe-body-script">//<![CDATA[  (function(){    var data = {    "addon_key":"com.mxgraph.confluence.plugins.diagramly",    "uniqueKey":"com.mxgraph.confluence.plugins.diagramly__inc-drawio8122018541812106549",    "key":"inc-drawio",     "moduleType":"dynamicContentMacros",      "moduleLocation":"content",         "cp":"/cpv/wiki",            "general":"",    "w":"",    "h":"",    "url":"https://confluence.draw.io/connect/confluence/viewer-1-4-8.html?linked=1&ceoId=493027878&imgPageId=473006389&diagramName=MS-Whispr-iObeya-Architecture&revision=&width=1261&height=725&tbstyle=&simple=&lbox=&zoom=&links=&owningPageId=470384760&displayName=MS-Whispr-iObeya-Architecture&contentId=&custContentId=470352338&contentVer=&diagramUrl=&aspect=Fje60DqaD5fT57pd31vx+1&aspectHash=079f65948d008454029450fc73f0e032de29ca68&attVer=&service=&sFileId=&odriveId=&xdm_e=https%3A%2F%2Fiadc.atlassian.net&xdm_c=channel-com.mxgraph.confluence.plugins.diagramly__inc-drawio8122018541812106549&cp=%2Fwiki&xdm_deprecated_addon_key_do_not_use=com.mxgraph.confluence.plugins.diagramly&lic=active&cv=1.691.0",        "structuredContext": "{\"license\":{\"active\":true},\"confluence\":{\"macro\":{\"outputType\":\"display\",\"hash\":\"47a6af02-987f-49af-a2bb-b6d874a64554\",\"id\":\"47a6af02-987f-49af-a2bb-b6d874a64554\"},\"content\":{\"type\":\"page\",\"version\":\"1\",\"id\":\"493027878\"},\"space\":{\"key\":\"IADC\",\"id\":\"185466888\"}}}",    "contentClassifier":"content",    "productCtx":"{\"page.id\":\"493027878\",\"macro.hash\":\"47a6af02-987f-49af-a2bb-b6d874a64554\",\"page.type\":\"page\",\": = | RAW | = :\":\"baseUrl=https://iadc.atlassian.net/wiki|imgPageId=473006389|diagramName=MS-Whispr-iObeya-Architecture|aspect=Fje60DqaD5fT57pd31vx 1|includedDiagram=1|width=1261|aspectHash=079f65948d008454029450fc73f0e032de29ca68|custContentId=470352338|pageId=470384760|diagramDisplayName=MS-Whispr-iObeya-Architecture|height=725\",\"space.id\":\"185466888\",\"diagramDisplayName\":\"MS-Whispr-iObeya-Architecture\",\"diagramName\":\"MS-Whispr-iObeya-Architecture\",\"aspect\":\"Fje60DqaD5fT57pd31vx 1\",\"includedDiagram\":\"1\",\"aspectHash\":\"079f65948d008454029450fc73f0e032de29ca68\",\"height\":\"725\",\"space.key\":\"IADC\",\"user.id\":\"5cb43c00675d991189b673e8\",\"content.version\":\"1\",\"page.title\":\"CPV tests - drawio\",\"macro.body\":\"\",\"custContentId\":\"470352338\",\"pageId\":\"470384760\",\"macro.truncated\":\"false\",\"content.type\":\"page\",\"output.type\":\"display\",\"page.version\":\"1\",\"user.key\":\"8a7f808a6d61ee43016d62fdeb7a0010\",\"baseUrl\":\"/cpv/wiki\",\"imgPageId\":\"473006389\",\"content.id\":\"493027878\",\"width\":\"1261\",\"macro.id\":\"47a6af02-987f-49af-a2bb-b6d874a64554\"}",    "timeZone":"Europe/Berlin",    "origin":"https://confluence.draw.io",    "hostOrigin":"https://iadc.atlassian.net",    "sandbox":"allow-downloads allow-forms allow-modals allow-popups allow-scripts allow-same-origin allow-top-navigation-by-user-activation",        "apiMigrations": {        "gdpr": true    }};    if(window.AP && window.AP.subCreate) {      window._AP.appendConnectAddon(data);    } else {      require(['ac/create'], function(create){        create.appendConnectAddon(data);      });    }  }());//]]></script></div>` +
  `<script>document.addEventListener('DOMContentLoaded', function () {new Zooming({}).listen('.img-zoomable');new Zooming({}).listen('.confluence-embedded-image')})</script><script>var coll = document.getElementsByClassName("expand-control");        var i;        for (i = 0; i < coll.length; i++) {          coll[i].addEventListener("click", function() {            this.classList.toggle("active");            var content = this.nextElementSibling;            if (content.style.display === "block") {              content.style.display = "none";            } else {              content.style.display = "block";            }          });        }</script></div>` +
  `</body></html>`;

describe('Speed / Steps', () => {
  let context: ContextService;
  let config: ConfigService;
  /**
   * Time expected for each step to be execute within, in ms.
   */
  const timeExpected = 80;
  /**
   * Number of time we check the step execution time.
   */
  const iteration = 100;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    context.Init('XXX', '123456', 'dark');
  });

  it(`Should execute each step under ${timeExpected}ms ${iteration} times in a row`, async () => {
    // Reading of the step files
    const files = await fs.promises.readdir('src/proxy-page/steps');
    for (const file of files) {
      const filename = file.split('.').slice(0, -1).join('.');
      const filePath = `../../../src/proxy-page/steps/${filename}`;
      let module;
      try {
        // Import the file module dynamically
        module = await import(filePath);
      } catch (error) {
        break;
      }
      if (!module) break;
      // Get the step from the module
      const step = module.default(config);
      // Do the speed test
      for (let i = 0; i < iteration; i++) {
        context.setHtmlBody(htmlContext);
        const start = performance.now();
        step(context);
        const end = performance.now();
        expect(end - start).toBeLessThan(timeExpected);
      }
    }
  });
});
