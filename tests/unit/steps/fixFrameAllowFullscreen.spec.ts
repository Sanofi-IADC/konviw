import fixFrameAllowFullscreen from '../../../src/proxy-page/steps/fixFrameAllowFullscreen';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';
import * as cheerio from 'cheerio';

describe('ConfluenceProxy / fixFrameAllowFullscreen', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);

    context.Init('XXX', '123456', 'dark');
  });

  it('Enable fullscreen lazy loading and other attributes', () => {
    const step = fixFrameAllowFullscreen();
    const inputHtml =
      `<html><head></head><body>` +
      `<iframe src="https://url-to-embed" ` +
      `align="middle" width="500" height="250" ` +
      `class="conf-macro output-block" ` +
      `frameborder="1">` +
      `#document` +
      `</iframe>` +
      `<span class="confluence-embedded-file-wrapper image-center-wrapper">` +
      `</span></body></html>`;
    context.setHtmlBody(inputHtml);
    step(context);
    const $ = cheerio.load(context.getHtmlBody());
    $('iframe').each((_index: number, elementFrame: cheerio.Element) => {
      expect($(elementFrame).attr('allow')).toEqual(
        'autoplay *; fullscreen *; encrypted-media *; accelerometer; gyroscope; picture-in-picture',
      );
      expect($(elementFrame).attr('loading')).toEqual('auto');
      expect($(elementFrame).attr('referrerpolicy')).toEqual('no-referrer');
      expect($(elementFrame).attr('allowfullscreen')).toEqual('');
      expect($(elementFrame).attr('webkitallowfullscreen')).toEqual('');
      expect($(elementFrame).attr('mozallowfullscreen')).toEqual('');
    });
  });

  it('Include styles for rounder border', () => {
    const step = fixFrameAllowFullscreen();
    const inputHtml =
      `<html><head></head><body>` +
      `<iframe src="https://url-to-embed" ` +
      `align="middle" width="100%" height="250" ` +
      `class="conf-macro output-block" ` +
      `style="color: #fafafa" ` +
      `frameborder="1">` +
      `#document` +
      `</iframe>` +
      `<span class="confluence-embedded-file-wrapper image-center-wrapper">` +
      `</span></body></html>`;
    context.setHtmlBody(inputHtml);
    step(context);
    const $ = cheerio.load(context.getHtmlBody());
    $('iframe').each((_index: number, elementFrame: cheerio.Element) => {
      expect($(elementFrame).attr('style')).toEqual(
        'border-radius: 10px; border: 2px solid #eee; color: #fafafa',
      );
    });
  });

  it('Responsive video with height adjusted to 16:9 aspect ratio', () => {
    const step = fixFrameAllowFullscreen();
    const inputHtml =
      `<html><head></head><body>` +
      `<iframe src="https://url-to-embed" ` +
      `align="middle" width="100%" height="250" ` +
      `class="conf-macro output-block" ` +
      `style="color: #fafafa" ` +
      `name="16:9" ` +
      `frameborder="1">` +
      `#document` +
      `</iframe>` +
      `<span class="confluence-embedded-file-wrapper image-center-wrapper">` +
      `</span></body></html>`;
    context.setHtmlBody(inputHtml);
    step(context);
    const $ = cheerio.load(context.getHtmlBody());
    $('iframe').each((_index: number, elementFrame: cheerio.Element) => {
      expect($(elementFrame).attr('height')).toBeUndefined();
      expect($(elementFrame).attr('style')).toEqual(
        'border-radius: 10px; border: 2px solid #eee; position: absolute; top: 0; left: 0; width: 100%; height: 100%; color: #fafafa',
      );
      expect($(elementFrame).parent().attr('style')).toEqual(
        'position: relative; padding-bottom: 56.25%',
      );
      expect($(elementFrame).parent().parent().attr('style')).toEqual(
        'width: 100%',
      );
    });
  });

  it('Responsive video with height adjusted to 4:3 aspect ratio', () => {
    const step = fixFrameAllowFullscreen();
    const inputHtml =
      `<html><head></head><body>` +
      `<iframe src="https://url-to-embed" ` +
      `align="middle" width="100%" height="250" ` +
      `class="conf-macro output-block" ` +
      `style="color: #fafafa" ` +
      `name="4:3" ` +
      `frameborder="1">` +
      `#document` +
      `</iframe>` +
      `<span class="confluence-embedded-file-wrapper image-center-wrapper">` +
      `</span></body></html>`;
    context.setHtmlBody(inputHtml);
    step(context);
    const $ = cheerio.load(context.getHtmlBody());
    $('iframe').each((_index: number, elementFrame: cheerio.Element) => {
      expect($(elementFrame).attr('height')).toBeUndefined();
      expect($(elementFrame).attr('style')).toEqual(
        'border-radius: 10px; border: 2px solid #eee; position: absolute; top: 0; left: 0; width: 100%; height: 100%; color: #fafafa',
      );
      expect($(elementFrame).parent().attr('style')).toEqual(
        'position: relative; padding-bottom: 75%',
      );
      expect($(elementFrame).parent().parent().attr('style')).toEqual(
        'width: 100%',
      );
    });
  });
});
