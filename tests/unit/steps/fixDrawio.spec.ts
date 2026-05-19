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

/**
 * Since 2026-05-19, Atlassian's drawio macro server-side preview generation
 * has been failing for some pages and Atlassian replaces the rendered diagram
 * with a generic warning macro body in the v2 view-format response:
 *
 *   <div class="confluence-information-macro confluence-information-macro-warning"
 *        data-macro-name="warning">
 *     <div class="confluence-information-macro-body">
 *       <p>Failed to load the diagram preview image.</p>
 *       <p>Authentication Required</p>
 *       <p>Page ID: 12345</p>
 *     </div>
 *   </div>
 *
 * konviw must recover by reading the diagram metadata from the storage body
 * (same trick as for the `<div>draw.io Board</div>` placeholder branch).
 */
describe('ConfluenceProxy / fixDrawio (Failed-to-load-preview warning fallback)', () => {
  let context: ContextService;
  let config: ConfigService;
  let webBasePath = '';

  const pageId = '63988664015';
  const diagram1 = 'Landing page structure.drawio';
  const diagram2 = 'Menu Structure.drawio';
  const diagram3 = 'Other resources.drawio';

  const buildWarning = (id: string, macroName = 'warning') => `
    <div class="confluence-information-macro confluence-information-macro-warning conf-macro output-block"
         data-hasbody="true" data-macro-name="${macroName}">
      <span class="aui-icon aui-icon-small aui-iconfont-error confluence-information-macro-icon"> </span>
      <div class="confluence-information-macro-body">
        <p>Failed to load the diagram preview image.</p>
        <p>Authentication Required</p>
        <p>Page ID: ${id}</p>
      </div>
    </div>`;

  // Atlassian emits the failure with various data-macro-name values
  // depending on the original macro context (warning, excerpt, etc.).
  // All shapes must be detected and replaced.
  const viewHtml = `
<html>
  <body>
    <h3>Three failed drawio diagrams plus a legitimate warning</h3>
    ${buildWarning(pageId, 'warning')}
    <p>some text</p>
    ${buildWarning(pageId, 'excerpt')}
    <p>more text</p>
    ${buildWarning(pageId, 'info')}
    <div class="confluence-information-macro confluence-information-macro-warning conf-macro output-block"
         data-macro-name="warning">
      <div class="confluence-information-macro-body">
        <p>This is a normal author-written warning, not a drawio failure.</p>
      </div>
    </div>
  </body>
</html>`;

  const buildStorageMacro = (name: string) => `
    <ac:structured-macro ac:name="drawio" ac:schema-version="1" ac:macro-id="m-${name}">
      <ac:parameter ac:name="pageId">${pageId}</ac:parameter>
      <ac:parameter ac:name="diagramName">${name}</ac:parameter>
    </ac:structured-macro>`;

  const storageXml = `
${buildStorageMacro(diagram1)}
${buildStorageMacro(diagram2)}
${buildStorageMacro(diagram3)}
`;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    webBasePath = config.get('web.absoluteBasePath') ?? '';

    context.initPageContext('v2', 'XXX', pageId, 'dark');
    context.setHtmlBody(viewHtml);
    context.setBodyStorage(storageXml);
    const step = fixDrawio(config);
    step(context);
  });

  it('replaces every drawio-failure warning with a proper image, in document order', () => {
    const $ = context.getCheerioBody();
    const imgs = $('img.drawio-zoomable');
    expect(imgs.length).toBe(3);
    expect(imgs.eq(0).attr('src')).toBe(
      `${webBasePath}/wiki/download/attachments/${pageId}/${diagram1}.png`,
    );
    expect(imgs.eq(1).attr('src')).toBe(
      `${webBasePath}/wiki/download/attachments/${pageId}/${diagram2}.png`,
    );
    expect(imgs.eq(2).attr('src')).toBe(
      `${webBasePath}/wiki/download/attachments/${pageId}/${diagram3}.png`,
    );
    expect(imgs.eq(0).attr('alt')).toBe(diagram1);
  });

  it('removes the drawio-failure warning text from the rendered body', () => {
    const $ = context.getCheerioBody();
    expect($.html()).not.toContain('Failed to load the diagram preview image');
  });

  it('leaves unrelated author-written warning macros untouched', () => {
    const $ = context.getCheerioBody();
    expect($.html()).toContain(
      'This is a normal author-written warning, not a drawio failure.',
    );
  });
});

/**
 * Some pages store the drawio macro as a Forge ecosystem extension instead of
 * the legacy `<ac:structured-macro ac:name="drawio">`. The extension can also
 * be wrapped inside another macro (e.g. `excerpt`), which causes the rendered
 * failure macro to come back with `data-macro-name="excerpt"`. The storage XML
 * additionally contains a duplicate `<ac:adf-fallback>` copy that must be
 * skipped when correlating placeholders to macros by document order.
 */
describe('ConfluenceProxy / fixDrawio (Forge ecosystem extension shape)', () => {
  let context: ContextService;
  let config: ConfigService;
  let webBasePath = '';

  const pageId = '63881347657';
  const diagramFileName = 'C4-Diagram-L1.drawio';

  const viewHtml = `
<html>
  <body>
    <h3>One drawio inside an excerpt</h3>
    <div class="confluence-information-macro confluence-information-macro-warning"
         data-hasbody="true" data-macro-name="excerpt">
      <div class="confluence-information-macro-body">
        <p>Failed to load the diagram preview image.</p>
        <p>Authentication Required</p>
        <p>Page ID: ${pageId}</p>
      </div>
    </div>
  </body>
</html>`;

  const storageXml = `
<ac:structured-macro ac:name="excerpt" ac:schema-version="1" ac:macro-id="0c948a1c29bbb52288703451a698b483">
  <ac:parameter ac:name="name">c2 overview</ac:parameter>
  <ac:rich-text-body>
    <ac:adf-extension>
      <ac:adf-node type="extension">
        <ac:adf-attribute key="extension-key">ari:cloud:ecosystem::extension/.../static/drawio</ac:adf-attribute>
        <ac:adf-attribute key="extension-type">com.atlassian.ecosystem</ac:adf-attribute>
        <ac:adf-attribute key="parameters">
          <ac:adf-parameter key="extension-title">draw.io Diagram</ac:adf-parameter>
          <ac:adf-parameter key="guest-params">
            <ac:adf-parameter key="diagram-name">${diagramFileName}</ac:adf-parameter>
            <ac:adf-parameter key="diagram-display-name">C4-Diagram-L2.drawio</ac:adf-parameter>
            <ac:adf-parameter key="page-id">${pageId}</ac:adf-parameter>
          </ac:adf-parameter>
        </ac:adf-attribute>
      </ac:adf-node>
      <ac:adf-fallback>
        <ac:adf-node type="extension">
          <ac:adf-attribute key="extension-key">ari:cloud:ecosystem::extension/.../static/drawio</ac:adf-attribute>
          <ac:adf-attribute key="parameters">
            <ac:adf-parameter key="guest-params">
              <ac:adf-parameter key="diagram-name">SHOULD-NOT-BE-USED.drawio</ac:adf-parameter>
              <ac:adf-parameter key="page-id">${pageId}</ac:adf-parameter>
            </ac:adf-parameter>
          </ac:adf-attribute>
        </ac:adf-node>
      </ac:adf-fallback>
    </ac:adf-extension>
  </ac:rich-text-body>
</ac:structured-macro>`;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    webBasePath = config.get('web.absoluteBasePath') ?? '';

    context.initPageContext('v2', 'XXX', pageId, 'dark');
    context.setHtmlBody(viewHtml);
    context.setBodyStorage(storageXml);
    const step = fixDrawio(config);
    step(context);
  });

  it('replaces the Forge-extension drawio failure with the proper image', () => {
    const $ = context.getCheerioBody();
    const imgs = $('img.drawio-zoomable');
    expect(imgs.length).toBe(1);
    expect(imgs.eq(0).attr('src')).toBe(
      `${webBasePath}/wiki/download/attachments/${pageId}/${diagramFileName}.png`,
    );
    expect(imgs.eq(0).attr('alt')).toBe(diagramFileName);
  });

  it('removes the failure warning from the rendered body', () => {
    const $ = context.getCheerioBody();
    expect($.html()).not.toContain('Failed to load the diagram preview image');
  });

  it('does not pick up the diagram-name from the <ac:adf-fallback> copy', () => {
    const $ = context.getCheerioBody();
    expect($.html()).not.toContain('SHOULD-NOT-BE-USED');
  });
});

const getImgSrc = (image): string => {
  const regex = new RegExp('src="([^"]*)');
  return regex.exec(image)[1];
};
