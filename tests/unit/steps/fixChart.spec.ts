import { ContextService } from '../../../src/context/context.service';
import { ConfigService } from '@nestjs/config';
import fixChartMacro from '../../../src/proxy-page/steps/fixChart';
import { createModuleRefForStep } from './utils';

const attachmentFileName = 'awesome-diagram.png';

const example = `
<html>
  <body>
    <div id="Content">

      <h3>Chart macro in this page</h3>

      <div class="chart-macro conf-macro output-block">
        <div class="chart-bootstrap-wrapper">
          <script class="chart-render-data" id="render-data-d16fac8b-d2be-471f-a029-ff30dce47817" data-render-data-id="d16fac8b-d2be-471f-a029-ff30dce47817" type="application/json">
            //<![CDATA[
              {"pluginKey":"confluence.extra.chart","moduleKey":"chart","sourceMacroIds":[],"parameters":{"orientation":"vertical","showShapes":"false","attachment":"^${attachmentFileName}","legend":"false","forgive":"false","width":"400","rangeAxisLowerBound":"0","dataOrientation":"vertical","attachmentVersion":"replace","opacity":"100","colors":"red, green, yellow","height":"400",": \u003d | RAW | \u003d :":"orientation\u003dvertical|showShapes\u003dfalse|attachment\u003d^PieChartExample.png|legend\u003dfalse|forgive\u003dfalse|width\u003d400|rangeAxisLowerBound\u003d0|dataOrientation\u003dvertical|attachmentVersion\u003dreplace|opacity\u003d100|colors\u003dred, green, yellow|height\u003d400"},"bodyHtml":"\u003cdiv class\u003d\"table-wrap\"\u003e\u003ctable data-layout\u003d\"default\" class\u003d\"confluenceTable\"\u003e\u003ccolgroup\u003e\u003ccol style\u003d\"width: 363.0px;\"/\u003e\u003ccol style\u003d\"width: 363.0px;\"/\u003e\u003c/colgroup\u003e\u003ctbody\u003e\u003ctr\u003e\u003cth class\u003d\"confluenceTh\"\u003e\u003cp\u003e\u003cstrong\u003eSales\u003c/strong\u003e\u003c/p\u003e\u003c/th\u003e\u003ctd class\u003d\"confluenceTd\"\u003e\u003cp\u003e2011\u003c/p\u003e\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003cth class\u003d\"confluenceTh\"\u003e\u003cp\u003e2/2011\u003c/p\u003e\u003c/th\u003e\u003ctd class\u003d\"confluenceTd\"\u003e\u003cp\u003e41.8\u003c/p\u003e\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003cth class\u003d\"confluenceTh\"\u003e\u003cp\u003e3/2011\u003c/p\u003e\u003c/th\u003e\u003ctd class\u003d\"confluenceTd\"\u003e\u003cp\u003e51.3\u003c/p\u003e\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003cth class\u003d\"confluenceTh\"\u003e\u003cp\u003e4/2011\u003c/p\u003e\u003c/th\u003e\u003ctd class\u003d\"confluenceTd\"\u003e\u003cp\u003e33.8\u003c/p\u003e\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003cth class\u003d\"confluenceTh\"\u003e\u003cp\u003e5/2011\u003c/p\u003e\u003c/th\u003e\u003ctd class\u003d\"confluenceTd\"\u003e\u003cp\u003e27.6\u003c/p\u003e\u003c/td\u003e\u003c/tr\u003e\u003c/tbody\u003e\u003c/table\u003e\u003c/div\u003e","contentId":1578567204}
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
  const images: Array<string> = [];

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);

    context.Init('XXX', '123456', 'dark');
    const step = fixChartMacro(config);
    context.setHtmlBody(example);
    step(context);
    const $ = context.getCheerioBody();

    $('figure').each((index: number, element: cheerio.TagElement) => {
      const thisBlock = $(element).html();
      if (thisBlock) {
        images[index] = thisBlock;
      }
    });
  });

  describe('Chart created in the same page', () => {
    it('should set the src of the image with the current pageId and the attachmentFileName', () => {
      const image = images[0];
      const expectedSrc = `/cpv/wiki/download/attachments/123456/${attachmentFileName}`;
      const imgSrc = getImgSrc(image);
      expect(imgSrc).toBe(expectedSrc);
    });
  });
});

const getImgSrc = (image): string => {
  const regex = new RegExp('src="([^"]*)');
  return regex.exec(image)[1];
};
