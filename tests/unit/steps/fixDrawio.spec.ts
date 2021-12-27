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
              "productCtx":"{\\"page.id\\":\\"${image1PageId}\\",\\": = | RAW | = :\\":\\"diagramName=${image1DiagramName}|\\"}",};
          })();
        </script>
      </div>

      <h3>Drawio included from the repository</h3>
      <div class="ap-container" data-macro-name="inc-drawio">
        <script>
          (function () {
            var data = {
              "productCtx":"{\\"page.id\\":\\"123456\\",\\": = | RAW | = :\\":\\"diagramName=${image2DiagramName}|aspectHash=${image2AspectHash}|\\"}",};
          })();
        </script>
      </div>
  </body>
</html>
`;

describe('ConfluenceProxy / fixDrawio', () => {
  let context: ContextService;
  let config: ConfigService;
  const images: Array<string> = [];

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);

    context.Init('XXX', '123456', 'dark');
    const step = fixDrawio(config);
    context.setHtmlBody(example);
    step(context);
    const $ = context.getCheerioBody();

    $('figure').each((index: number, element: cheerio.Element) => {
      const thisBlock = $(element).html();
      if (thisBlock) {
        images[index] = thisBlock;
      }
    });
  });

  describe('Diagram created in the same page', () => {
    it('should set the src of the image with the pageId and the diagramName', () => {
      const image = images[0];
      const expectedSrc = `/cpv/wiki/download/attachments/${image1PageId}/${image1DiagramName}.png`;
      const imgSrc = getImgSrc(image);
      expect(imgSrc).toBe(expectedSrc);
    });
  });

  describe('Diagram imported from the repository', () => {
    it('should set the src of the image with the the diagramName and the aspectHash', () => {
      const image = images[1];
      const expectedSrc = `/cpv/wiki/download/attachments/123456/${image2DiagramName}-${image2AspectHash}.png`;
      const imgSrc = getImgSrc(image);
      expect(imgSrc).toBe(expectedSrc);
    });
  });
});

const getImgSrc = (image): string => {
  const regex = new RegExp('src="([^"]*)');
  return regex.exec(image)[1];
};
