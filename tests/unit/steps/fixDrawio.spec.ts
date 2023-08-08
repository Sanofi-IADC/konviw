import { ContextService } from '../../../src/context/context.service';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import fixDrawio from '../../../src/proxy-page/steps/fixDrawio';
import { createModuleRefForStep } from './utils';

const image1PageId = '493027878';
const image1DiagramName = 'awesome-diagram';

const image2DiagramName = 'prettycool-diagram';
const image2AspectHash = '079f65948d008454029450fc73f0e032de29ca68';

const example = `
<html>
  <body>

      <h3>New Drawio chart created in this page</h3>
      <div class="ap-container" data-macro-name="drawio">
        <script>
          (function () {
            var data = {
              "productCtx":"{\\"pageId\\":\\"${image1PageId}\\",\\": = | RAW | = :\\":\\"diagramName=${image1DiagramName}|\\"}",};
          })();
        </script>
      </div>

      <h3>Drawio included from the repository</h3>
      <div class="ap-container" data-macro-name="inc-drawio">
        <script>
          (function () {
            var data = {
              "productCtx":"{\\"pageId\\":\\"123456\\",\\": = | RAW | = :\\":\\"diagramName=${image2DiagramName}|aspectHash=${image2AspectHash}|\\"}",};
          })();
        </script>
      </div>
  </body>
</html>
`;

describe('ConfluenceProxy / fixDrawio', () => {
  let context: ContextService;
  let config: ConfigService;
  let webBasePath = '';
  let $: cheerio.CheerioAPI;
  const images: Array<cheerio.Element> = [];

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    webBasePath = config.get('web.absoluteBasePath') ?? '';

    context.initPageContext('v2', 'XXX', '123456', 'dark');
    const step = fixDrawio(config);
    context.setHtmlBody(example);
    step(context);
    $ = context.getCheerioBody();

    $('figure').each((index: number, element: cheerio.Element) => {
      images[index] = element;
    });
  });

  describe('Diagram created in the same page', () => {
    it('should set the src of the image with the pageId and the diagramName', () => {
      const image = $(images[0]).html();
      const expectedSrc = `${webBasePath}/wiki/download/attachments/${image1PageId}/${image1DiagramName}.png`;
      const imgSrc = getImgSrc(image);
      expect(imgSrc).toBe(expectedSrc);
    });
    it('should has zoomable class', () => {
      expect($(images[0]).children().first().hasClass('drawio-zoomable')).toBe(
        true,
      );
    });
  });

  describe('Diagram imported from the repository', () => {
    it('should set the src of the image with the the diagramName and the aspectHash', () => {
      const image = $(images[1]).html();
      const expectedSrc = `${webBasePath}/wiki/download/attachments/123456/${image2DiagramName}-${image2AspectHash}.png`;
      const imgSrc = getImgSrc(image);
      expect(imgSrc).toBe(expectedSrc);
    });
    it('should has zoomable class', () => {
      expect($(images[1]).children().first().hasClass('drawio-zoomable')).toBe(
        true,
      );
    });
  });
});

const getImgSrc = (image): string => {
  const regex = new RegExp('src="([^"]*)');
  return regex.exec(image)[1];
};
