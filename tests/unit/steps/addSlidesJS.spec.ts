import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import addSlidesJS from '../../../src/proxy-page/steps/addSlidesJS';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / addLibrariesJS', () => {
  let config: ConfigService;
  let context: ContextService;
  let basePath;

  beforeEach(async () => {
    jest.resetModules(); // it clears the cache
    const moduleRef = await createModuleRefForStep();
    config = moduleRef.get<ConfigService>(ConfigService);
    basePath = config.get('web.basePath');
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'XXX', '123456', 'dark');
    const step = addSlidesJS(config);
    context.setHtmlBody('<html><head></head><body></body></html>');
    step(context);
  });

  it('should add reveal.js JS library', () => {
    expect(context.getHtmlBody()).toMatch(/<script src="https?:.*reveal\.min\.js/);
  });

  it('should add highlight.js JS library', () => {
    expect(context.getHtmlBody()).toMatch(/<script src="https?:.*highlight\.min\.js/);
  });

  it('should add zoom.js Reveal Plugin', () => {
    expect(context.getHtmlBody()).toMatch(/<script src="https?:.*zoom\.min\.js/);
  });

  it('should add menu.js Reveal Plugin', () => {
    expect(context.getHtmlBody()).toMatch(new RegExp (`<script src="${basePath}/reveal/plugin/.*/menu.js`));
  });

  it('should initialize Reveal Library with plugins', () => {
    expect(context.getHtmlBody()).toContain('Reveal.initialize({');
    expect(context.getHtmlBody()).toContain('plugins: [ RevealZoom, RevealHighlight, RevealMenu]');
  });

});