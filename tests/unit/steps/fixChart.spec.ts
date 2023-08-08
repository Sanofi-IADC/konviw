import { ContextService } from '../../../src/context/context.service';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import fixChartMacro from '../../../src/proxy-page/steps/fixChart';
import { createModuleRefForStep } from './utils';

const page = '123456';
const attachmentFileName = 'awesome-diagram.png';
let webBasePath = '';

const exampleAttachmentSamePage = `
<html>
  <body>
    <div id="Content">

      <h3>Chart macro in this page</h3>

      <div class="chart-macro conf-macro output-block">
        <div class="chart-bootstrap-wrapper">
          <script class="chart-render-data" id="render-data-d16fac8b-d2be-471f-a029-ff30dce47817" data-render-data-id="d16fac8b-d2be-471f-a029-ff30dce47817" type="application/json">
            //<![CDATA[
              {
                "pluginKey": "confluence.extra.chart",
                "moduleKey": "chart",
                "sourceMacroIds": [],
                "parameters": {
                  "imageFormat": "png",
                  "borderColor": "#e7e7e7",
                  "orientation": "vertical",
                  "dataDisplay": "before",
                  "forgive": "false",
                  "rangeAxisLowerBound": "0",
                  "dataOrientation": "vertical",
                  "title": "3D Pie chart",
                  "attachmentVersion": "replace",
                  "colors": "#e5343a, #f4ae01, #0064d3, #0f9d58",
                  "3D": "true",
                  "showShapes": "false",
                  "bgColor": "",
                  "subTitle": "Image generated by the macro",
                  "attachment":"^${attachmentFileName}",
                  "width": "550",
                  "opacity": "100",
                  "height": "400",
                  ": = | RAW | = :": "imageFormat=png|borderColor=#e7e7e7|orientation=vertical|dataDisplay=before|forgive=false|rangeAxisLowerBound=0|dataOrientation=vertical|title=3D Pie chart|attachmentVersion=replace|colors=#e5343a, #f4ae01, #0064d3, #0f9d58|3D=true|showShapes=false|bgColor=|subTitle=Image generated by the macro|attachment=^${attachmentFileName}|width=550|opacity=100|height=400"
                },
                "bodyHtml": "<div class='table-wrap'><table data-layout='default' data-local-id='e211f8b9-5045-4f21-925e-798bbf1689f7' class='confluenceTable'><colgroup><col style='width: 219.0px;'/><col style='width: 507.0px;'/></colgroup><tbody><tr><th class='confluenceTh'><p><strong>Sales</strong></p></th><th class='confluenceTh'><p>Value</p></th></tr><tr><td class='confluenceTd'><p>Spain</p></td><td class='confluenceTd'><p>40</p></td></tr><tr><td class='confluenceTd'><p>France</p></td><td class='confluenceTd'><p>10</p></td></tr><tr><td class='confluenceTd'><p>Germany</p></td><td class='confluenceTd'><p>22</p></td></tr><tr><td class='confluenceTd'><p>UK</p></td><td class='confluenceTd'><p>28</p></td></tr></tbody></table></div><p />",
                "contentId": "185794678"
              }
              //]]>
          </script>

        </div>
      </div>

    </div> <!-- #Content -->
  </body>
</html>
`;

const exampleAttachmentDifferentPage = `
<html>
  <body>
    <div id="Content">

      <h3>Chart macro in this page</h3>

      <div class="chart-macro conf-macro output-block">
        <div class="chart-bootstrap-wrapper">
          <script class="chart-render-data" id="render-data-d16fac8b-d2be-471f-a029-ff30dce47817" data-render-data-id="d16fac8b-d2be-471f-a029-ff30dce47817" type="application/json">
            //<![CDATA[
              {
                "pluginKey": "confluence.extra.chart",
                "moduleKey": "chart",
                "sourceMacroIds": [],
                "parameters": {
                  "imageFormat": "png",
                  "borderColor": "#e7e7e7",
                  "orientation": "vertical",
                  "dataDisplay": "before",
                  "forgive": "false",
                  "rangeAxisLowerBound": "0",
                  "dataOrientation": "vertical",
                  "title": "3D Pie chart",
                  "attachmentVersion": "replace",
                  "colors": "#e5343a, #f4ae01, #0064d3, #0f9d58",
                  "3D": "true",
                  "showShapes": "false",
                  "bgColor": "",
                  "subTitle": "Image generated by the macro",
                  "attachment":"${page}^${attachmentFileName}",
                  "width": "550",
                  "opacity": "100",
                  "height": "400",
                  ": = | RAW | = :": "imageFormat=png|borderColor=#e7e7e7|orientation=vertical|dataDisplay=before|forgive=false|rangeAxisLowerBound=0|dataOrientation=vertical|title=3D Pie chart|attachmentVersion=replace|colors=#e5343a, #f4ae01, #0064d3, #0f9d58|3D=true|showShapes=false|bgColor=|subTitle=Image generated by the macro|attachment=${page}^${attachmentFileName}|width=550|opacity=100|height=400"
                },
                "bodyHtml": "<div class='table-wrap'><table data-layout='default' data-local-id='e211f8b9-5045-4f21-925e-798bbf1689f7' class='confluenceTable'><colgroup><col style='width: 219.0px;'/><col style='width: 507.0px;'/></colgroup><tbody><tr><th class='confluenceTh'><p><strong>Sales</strong></p></th><th class='confluenceTh'><p>Value</p></th></tr><tr><td class='confluenceTd'><p>Spain</p></td><td class='confluenceTd'><p>40</p></td></tr><tr><td class='confluenceTd'><p>France</p></td><td class='confluenceTd'><p>10</p></td></tr><tr><td class='confluenceTd'><p>Germany</p></td><td class='confluenceTd'><p>22</p></td></tr><tr><td class='confluenceTd'><p>UK</p></td><td class='confluenceTd'><p>28</p></td></tr></tbody></table></div><p />",
                "contentId": "185794678"
              }
              //]]>
          </script>

        </div>
      </div>

    </div> <!-- #Content -->
  </body>
</html>
`;

describe('ConfluenceProxy / fixChartMacro', () => {
  let context: ContextService;
  let config: ConfigService;
  let images: Array<string> = [];

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    webBasePath = config.get('web.absoluteBasePath');

    context.initPageContextRestAPIv2('XXX', '123456', 'dark');
  });

  describe('Chart created in the same page', () => {
    it('should set the src of the image with the current pageId and the attachmentFileName', () => {
      const step = fixChartMacro(config);
      context.setHtmlBody(exampleAttachmentSamePage);
      step(context);
      const $ = context.getCheerioBody();

      images = getImages($, 'figure');
      const image = images[0];
      const expectedSrc = `${webBasePath}/wiki/download/attachments/123456/${attachmentFileName}`;
      const imgSrc = getImgSrc(image);
      expect(imgSrc).toBe(expectedSrc);
    });
  });

  describe('Chart created in a different page', () => {
    it('should set the src of the image with the related pageId and the attachmentFileName', () => {
      const step = fixChartMacro(config);
      context.setHtmlBody(exampleAttachmentDifferentPage);
      step(context);
      const $ = context.getCheerioBody();

      images = getImages($, 'figure');
      const image = images[0];
      const expectedSrc = `${webBasePath}/wiki/download/attachments/${page}/${attachmentFileName}`;
      const imgSrc = getImgSrc(image);
      expect(imgSrc).toBe(expectedSrc);
    });
  });
});

const getImgSrc = (image): string => {
  const regex = new RegExp('src="([^"]*)');
  return regex.exec(image)[1];
};

const getImages = (
  objCheerio: cheerio.CheerioAPI,
  tag: string,
): Array<string> => {
  const tmpImages: Array<string> = [];
  objCheerio(tag).each((index: number, element: cheerio.Element) => {
    const thisBlock = objCheerio(element).html();
    if (thisBlock) {
      tmpImages[index] = thisBlock;
    }
  });
  return tmpImages;
};
