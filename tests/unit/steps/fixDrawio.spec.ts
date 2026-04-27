import { ContextService } from '../../../src/context/context.service';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import fixDrawio from '../../../src/proxy-page/steps/fixDrawio';
import { createModuleRefForStep } from './utils';

const image1PageId = '493027878';
const image1DiagramName = 'awesome-diagram';
const image1ContentId = '123456';

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
              "productCtx":"{\\"pageId\\":\\"${image1PageId}\\",\\"content.id\\":\\"${image1ContentId}\\",\\": = | RAW | = :\\":\\"diagramName=${image1DiagramName}|\\"}",};
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
    it('should set the src of the image with the image1ContentId and the diagramName', () => {
      const image = $(images[0]).html();
      const expectedSrc = `${webBasePath}/wiki/download/attachments/${image1ContentId}/${image1DiagramName}.png`;
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

describe('ConfluenceProxy / fixDrawio (API v2 placeholder fallback)', () => {
  let context: ContextService;
  let config: ConfigService;
  let webBasePath = '';

  const v2DiagramName = 'my-v2-diagram';
  const v2PageId = '999888777';

  const v2ViewHtml = `
<html>
  <body>
    <h3>Drawio from v2 view format</h3>
    <div>draw.io Board</div>
  </body>
</html>
`;

  const v2StorageXml = `
<ac:structured-macro ac:name="drawio-sketch" ac:schema-version="1" ac:macro-id="abc123">
  <ac:parameter ac:name="pageId">${v2PageId}</ac:parameter>
  <ac:parameter ac:name="diagramName">${v2DiagramName}</ac:parameter>
</ac:structured-macro>
`;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    webBasePath = config.get('web.absoluteBasePath') ?? '';

    context.initPageContext('v2', 'XXX', v2PageId, 'dark');
    context.setHtmlBody(v2ViewHtml);
    context.setBodyStorage(v2StorageXml);
    const step = fixDrawio(config);
    step(context);
  });

  it('should replace the draw.io Board placeholder with an image from storage metadata', () => {
    const $ = context.getCheerioBody();
    const img = $('img.drawio-zoomable');
    expect(img.length).toBe(1);
    const expectedSrc = `${webBasePath}/wiki/download/attachments/${v2PageId}/${v2DiagramName}.png`;
    expect(img.attr('src')).toBe(expectedSrc);
    expect(img.attr('alt')).toBe(v2DiagramName);
  });

  it('should remove the draw.io Board text placeholder', () => {
    const $ = context.getCheerioBody();
    expect($.html()).not.toContain('draw.io Board');
  });
});

const getImgSrc = (image): string => {
  const regex = new RegExp('src="([^"]*)');
  return regex.exec(image)[1];
};
