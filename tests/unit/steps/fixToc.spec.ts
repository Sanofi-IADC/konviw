import fixToc from '../../../src/proxy-page/steps/fixToc';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';
import { Step } from '../../../src/proxy-page/proxy-page.step';

const example =
  '<html><head></head><body><div id="Content">' +
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
  '</div></body></html>';

describe('ConfluenceProxy / fix TOC', () => {
  let context: ContextService;
  let step: Step;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    step = fixToc();

    context.initPageContextRestAPIv2('XXX', '123456', 'dark');
    context.setHtmlBody(example);
  });

  it('should display a default TOC', () => {
    context
      .getCheerioBody()('#Content')
      .prepend(
        '<div class="toc-macro client-side-toc-macro  conf-macro output-block" data-headerelements="H1,H2,H3,H4,H5,H6,H7" data-hasbody="false" data-macro-name="toc" data-layout="default"> </div>',
      );
    step(context);
    const $ = context.getCheerioBody();
    expect($('div.toc-macro').html()).toEqual(
      '<ul>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="1"><span class="toc-outline">1</span><a href="#Header1" class="toc-link">Header 1</a></span>' +
        '<ul>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="1.1"><span class="toc-outline">1.1</span><a href="#Header1.1" class="toc-link">Header 1.1</a></span>' +
        '<ul>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="1.1.1"><span class="toc-outline">1.1.1</span><a href="#Header1.1.1" class="toc-link">Header 1.1.1</a></span>' +
        '<ul>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="1.1.1.1"><span class="toc-outline">1.1.1.1</span><a href="#Header1.1.1.1" class="toc-link">Header 1.1.1.1</a></span>' +
        '<ul>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="1.1.1.1.1"><span class="toc-outline">1.1.1.1.1</span><a href="#Header1.1.1.1.1" class="toc-link">Header 1.1.1.1.1</a></span>' +
        '<ul>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="1.1.1.1.1.1"><span class="toc-outline">1.1.1.1.1.1</span><a href="#Header1.1.1.1.1.1" class="toc-link">Header 1.1.1.1.1.1</a></span>' +
        '</li>' +
        '</ul>' +
        '</li>' +
        '</ul>' +
        '</li>' +
        '</ul>' +
        '</li>' +
        '</ul>' +
        '</li>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="1.2"><span class="toc-outline">1.2</span><a href="#Header1.2" class="toc-link">Header 1.2</a></span>' +
        '<ul>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="1.2.1"><span class="toc-outline">1.2.1</span><a href="#Header1.2.1" class="toc-link">Header 1.2.1</a></span>' +
        '</li>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="1.2.2"><span class="toc-outline">1.2.2</span><a href="#Header1.2.2" class="toc-link">Header 1.2.2</a></span>' +
        '</li>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="1.2.3"><span class="toc-outline">1.2.3</span><a href="#Header1.2.3" class="toc-link">Header 1.2.3</a></span>' +
        '</li>' +
        '</ul>' +
        '</li>' +
        '</ul>' +
        '</li>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="2"><span class="toc-outline">2</span><a href="#Header2" class="toc-link">Header 2</a></span>' +
        '</li>' +
        '<li>' +
        '<span class="toc-item-body" data-outline="3"><span class="toc-outline">3</span><a href="#Header3" class="toc-link">Header 3</a></span>' +
        '</li>' +
        '</ul>',
    );
  });

  it('should display a TOC with a flat structure and a pipe separator', () => {
    context
      .getCheerioBody()('#Content')
      .prepend(
        '<div class="toc-macro client-side-toc-macro  conf-macro output-block" data-structure="flat" data-midseparator=" | " data-headerelements="H1,H2,H3,H4,H5,H6,H7" data-hasbody="false" data-macro-name="toc" data-layout="default"> </div>',
      );
    step(context);
    const $ = context.getCheerioBody();
    expect($('div.toc-macro').html()).toEqual(
      '<span class="toc-item-container">' +
        '<span class="toc-item-body" data-outline="1"><span class="toc-outline">1</span><a href="#Header1" class="toc-link">Header 1</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="1.1"><span class="toc-outline">1.1</span><a href="#Header1.1" class="toc-link">Header 1.1</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="1.1.1"><span class="toc-outline">1.1.1</span><a href="#Header1.1.1" class="toc-link">Header 1.1.1</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="1.1.1.1"><span class="toc-outline">1.1.1.1</span><a href="#Header1.1.1.1" class="toc-link">Header 1.1.1.1</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="1.1.1.1.1"><span class="toc-outline">1.1.1.1.1</span><a href="#Header1.1.1.1.1" class="toc-link">Header 1.1.1.1.1</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="1.1.1.1.1.1"><span class="toc-outline">1.1.1.1.1.1</span><a href="#Header1.1.1.1.1.1" class="toc-link">Header 1.1.1.1.1.1</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="1.2"><span class="toc-outline">1.2</span><a href="#Header1.2" class="toc-link">Header 1.2</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="1.2.1"><span class="toc-outline">1.2.1</span><a href="#Header1.2.1" class="toc-link">Header 1.2.1</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="1.2.2"><span class="toc-outline">1.2.2</span><a href="#Header1.2.2" class="toc-link">Header 1.2.2</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="1.2.3"><span class="toc-outline">1.2.3</span><a href="#Header1.2.3" class="toc-link">Header 1.2.3</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="2"><span class="toc-outline">2</span><a href="#Header2" class="toc-link">Header 2</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="3"><span class="toc-outline">3</span><a href="#Header3" class="toc-link">Header 3</a></span>' +
        '</span>',
    );
  });

  it('should display a TOC with a squared list style', () => {
    context
      .getCheerioBody()('#Content')
      .prepend(
        '<div class="toc-macro client-side-toc-macro  conf-macro output-block" data-cssliststyle="square" data-headerelements="H1,H2,H3,H4,H5,H6,H7" data-hasbody="false" data-macro-name="toc" data-layout="default"> </div>',
      );
    step(context);
    const $ = context.getCheerioBody();
    $('div.toc-macro ul').each((_index, ul) => {
      expect($(ul).attr('style')).toContain('list-style: square;');
    });
  });

  describe(' / Outline', () => {
    it('should display a TOC without outline by default', () => {
      context
        .getCheerioBody()('#Content')
        .prepend(
          '<div class="toc-macro client-side-toc-macro  conf-macro output-block" data-headerelements="H1,H2,H3,H4,H5,H6,H7" data-hasbody="false" data-macro-name="toc" data-layout="default"> </div>',
        );
      step(context);
      const $ = context.getCheerioBody();
      expect($('div.toc-macro').hasClass('hidden-outline')).toBe(true);
    });

    it('should display a TOC with outline', () => {
      context
        .getCheerioBody()('#Content')
        .prepend(
          '<div class="toc-macro client-side-toc-macro  conf-macro output-block" data-numberedoutline="true" data-headerelements="H1,H2,H3,H4,H5,H6,H7" data-hasbody="false" data-macro-name="toc" data-layout="default"> </div>',
        );
      step(context);
      const $ = context.getCheerioBody();
      expect($('div.toc-macro').hasClass('hidden-outline')).toBe(false);
    });
  });

  describe(' / Filter by section level', () => {
    it('should display a TOC only with H1 sections', () => {
      context
        .getCheerioBody()('#Content')
        .prepend(
          '<div class="toc-macro client-side-toc-macro  conf-macro output-block" data-structure="flat" data-midseparator=" | " data-headerelements="H1" data-hasbody="false" data-macro-name="toc" data-layout="default"> </div>',
        );
      step(context);
      const $ = context.getCheerioBody();
      expect($('div.toc-macro').html()).toEqual(
        '<span class="toc-item-container">' +
          '<span class="toc-item-body" data-outline="1"><span class="toc-outline">1</span><a href="#Header1" class="toc-link">Header 1</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="2"><span class="toc-outline">2</span><a href="#Header2" class="toc-link">Header 2</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="3"><span class="toc-outline">3</span><a href="#Header3" class="toc-link">Header 3</a></span>' +
          '</span>',
      );
    });

    it('should display a TOC only with H1 and H2 sections', () => {
      context
        .getCheerioBody()('#Content')
        .prepend(
          '<div class="toc-macro client-side-toc-macro  conf-macro output-block" data-structure="flat" data-midseparator=" | " data-headerelements="H1,H2" data-hasbody="false" data-macro-name="toc" data-layout="default"> </div>',
        );
      step(context);
      const $ = context.getCheerioBody();
      expect($('div.toc-macro').html()).toEqual(
        '<span class="toc-item-container">' +
          '<span class="toc-item-body" data-outline="1"><span class="toc-outline">1</span><a href="#Header1" class="toc-link">Header 1</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="1.1"><span class="toc-outline">1.1</span><a href="#Header1.1" class="toc-link">Header 1.1</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="1.2"><span class="toc-outline">1.2</span><a href="#Header1.2" class="toc-link">Header 1.2</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="2"><span class="toc-outline">2</span><a href="#Header2" class="toc-link">Header 2</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="3"><span class="toc-outline">3</span><a href="#Header3" class="toc-link">Header 3</a></span>' +
          '</span>',
      );
    });
  });

  describe(' / Regex', () => {
    it('should display a TOC only with sections that match this regex: Header 1\\.2\\.?.*', () => {
      context
        .getCheerioBody()('#Content')
        .prepend(
          '<div class="toc-macro client-side-toc-macro  conf-macro output-block" data-includeheaderregex="Header 1\\.2\\.?.*" data-structure="flat" data-midseparator=" | " data-headerelements="H1,H2,H3,H4,H5,H6,H7" data-hasbody="false" data-macro-name="toc" data-layout="default"> </div>',
        );
      step(context);
      const $ = context.getCheerioBody();
      expect($('div.toc-macro').html()).toEqual(
        '<span class="toc-item-container">' +
          '<span class="toc-item-body" data-outline="1.2"><span class="toc-outline">1.2</span><a href="#Header1.2" class="toc-link">Header 1.2</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="1.2.1"><span class="toc-outline">1.2.1</span><a href="#Header1.2.1" class="toc-link">Header 1.2.1</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="1.2.2"><span class="toc-outline">1.2.2</span><a href="#Header1.2.2" class="toc-link">Header 1.2.2</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="1.2.3"><span class="toc-outline">1.2.3</span><a href="#Header1.2.3" class="toc-link">Header 1.2.3</a></span>' +
          '</span>',
      );
    });

    it("should display a TOC only with sections that don't match this regex: Header 1\\.2\\.?.*", () => {
      context
        .getCheerioBody()('#Content')
        .prepend(
          '<div class="toc-macro client-side-toc-macro  conf-macro output-block" data-excludeheaderregex="Header 1\\.2\\.?.*" data-structure="flat" data-midseparator=" | " data-headerelements="H1,H2,H3,H4,H5,H6,H7" data-hasbody="false" data-macro-name="toc" data-layout="default"> </div>',
        );
      step(context);
      const $ = context.getCheerioBody();
      expect($('div.toc-macro').html()).toEqual(
        '<span class="toc-item-container">' +
          '<span class="toc-item-body" data-outline="1"><span class="toc-outline">1</span><a href="#Header1" class="toc-link">Header 1</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="1.1"><span class="toc-outline">1.1</span><a href="#Header1.1" class="toc-link">Header 1.1</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="1.1.1"><span class="toc-outline">1.1.1</span><a href="#Header1.1.1" class="toc-link">Header 1.1.1</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="1.1.1.1"><span class="toc-outline">1.1.1.1</span><a href="#Header1.1.1.1" class="toc-link">Header 1.1.1.1</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="1.1.1.1.1"><span class="toc-outline">1.1.1.1.1</span><a href="#Header1.1.1.1.1" class="toc-link">Header 1.1.1.1.1</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="1.1.1.1.1.1"><span class="toc-outline">1.1.1.1.1.1</span><a href="#Header1.1.1.1.1.1" class="toc-link">Header 1.1.1.1.1.1</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="2"><span class="toc-outline">2</span><a href="#Header2" class="toc-link">Header 2</a></span>' +
          '<span class="toc-separator"> | </span>' +
          '<span class="toc-item-body" data-outline="3"><span class="toc-outline">3</span><a href="#Header3" class="toc-link">Header 3</a></span>' +
          '</span>',
      );
    });
  });

  it('should display a TOC only with H3 sections that match this regex: Header 1\\.2\\.?.*', () => {
    context
      .getCheerioBody()('#Content')
      .prepend(
        '<div class="toc-macro client-side-toc-macro  conf-macro output-block" data-includeheaderregex="Header 1\\.2\\.?.*" data-structure="flat" data-midseparator=" | " data-headerelements="H3" data-hasbody="false" data-macro-name="toc" data-layout="default"> </div>',
      );
    step(context);
    const $ = context.getCheerioBody();
    expect($('div.toc-macro').html()).toEqual(
      '<span class="toc-item-container">' +
        '<span class="toc-item-body" data-outline="1.2.1"><span class="toc-outline">1.2.1</span><a href="#Header1.2.1" class="toc-link">Header 1.2.1</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="1.2.2"><span class="toc-outline">1.2.2</span><a href="#Header1.2.2" class="toc-link">Header 1.2.2</a></span>' +
        '<span class="toc-separator"> | </span>' +
        '<span class="toc-item-body" data-outline="1.2.3"><span class="toc-outline">1.2.3</span><a href="#Header1.2.3" class="toc-link">Header 1.2.3</a></span>' +
        '</span>',
    );
  });
});
