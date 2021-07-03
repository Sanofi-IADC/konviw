import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import fixLinks from '../../../src/proxy-page/steps/fixLinks';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / fixLinks', () => {
  let context: ContextService;
  let config: ConfigService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);

    context.Init('XXX', '123456', 'dark');
  });

  it('should replace page absolute URLs', () => {
    const step = fixLinks(config);
    const example =
      '<html><head></head><body>' +
      '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4242/Hello+World">test</a>' +
      '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4343/Hello+World">test2</a>' +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected =
      '<html><head></head><body>' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4242/Hello+World">test</a>' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4343/Hello+World">test2</a>' +
      '</body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace page absolute URIs', () => {
    const step = fixLinks(config);
    const example =
      '<html><head></head><body>' +
      '<a href="/wiki/spaces/XXX/pages/4242/Hello+World">test</a>' +
      '<a href="/wiki/spaces/XXX/pages/4343/Hello+World">test2</a>' +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected =
      '<html><head></head><body>' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4242/Hello+World">test</a>' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4343/Hello+World">test2</a>' +
      '</body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace page absolute URLs with Anchors and without title', () => {
    const step = fixLinks(config);
    const example =
      '<html><head></head><body>' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4242/Hello+World#Nulla-tempus-vitae-ipsum-vitae-rhoncus."></a>' +
      '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4343/Hello+World#This-Is-Another-Heading"></a>' +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected =
      '<html><head></head><body>' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4242/#HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">Hello World | Nulla tempus vitae ipsum vitae rhoncus.</a>' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4343/#HelloWorld-ThisIsAnotherHeading">Hello World | This Is Another Heading</a>' +
      '</body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace page absolute URLs with Anchors and respect original title', () => {
    const step = fixLinks(config);
    const example =
      '<html><head></head><body>' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4242/Hello+World#Nulla-tempus-vitae-ipsum-vitae-rhoncus.">test</a>' +
      '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4343/Hello+World#This-Is-Another-Heading">test2</a>' +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected =
      '<html><head></head><body>' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4242/#HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">test</a>' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4343/#HelloWorld-ThisIsAnotherHeading">test2</a>' +
      '</body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace page absolute URIs with Anchors and without title', () => {
    const step = fixLinks(config);
    const example =
      '<html><head></head><body>' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      '<a href="/wiki/spaces/XXX/pages/4242/Hello+World#Nulla-tempus-vitae-ipsum-vitae-rhoncus."></a>' +
      '<a href="/wiki/spaces/XXX/pages/4343/Hello+World#This-Is-Another-Heading"></a>' +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected =
      '<html><head></head><body>' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4242/#HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">Hello World | Nulla tempus vitae ipsum vitae rhoncus.</a>' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4343/#HelloWorld-ThisIsAnotherHeading">Hello World | This Is Another Heading</a>' +
      '</body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace page absolute URIs with Anchors and respect original title', () => {
    const step = fixLinks(config);
    const example =
      '<html><head></head><body>' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      '<a href="/wiki/spaces/XXX/pages/4242/Hello+World#Nulla-tempus-vitae-ipsum-vitae-rhoncus.">test</a>' +
      '<a href="/wiki/spaces/XXX/pages/4343/Hello+World#This-Is-Another-Heading">test2</a>' +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected =
      '<html><head></head><body>' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4242/#HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">test</a>' +
      '<a href="/cpv/wiki/spaces/XXX/pages/4343/#HelloWorld-ThisIsAnotherHeading">test2</a>' +
      '</body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace image URLs', () => {
    const step = fixLinks(config);
    const example =
      '<html><head></head><body>' +
      '<img src="https://test.atlassian.net/wiki/download/thumbnails/241271570/image-20200312-161409.png?width=521&amp;height=196">' +
      '<img src="https://test.atlassian.net/wiki/download/thumbnails/241271571/image-20200312-161401.png?width=521&amp;height=196">' +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected =
      '<html><head></head><body>' +
      '<img src="/cpv/wiki/download/thumbnails/241271570/image-20200312-161409.png?width=521&amp;height=196">' +
      '<img src="/cpv/wiki/download/thumbnails/241271571/image-20200312-161401.png?width=521&amp;height=196">' +
      '</body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should open external links in a new tab', () => {
    const step = fixLinks(config);
    const example =
      '<html><head></head><body>' +
      '<a href="https://www.example.com/home" class="external-link">Example</a>' +
      '<a href="https://www.google.com/about" class="external-link">Google</a>' +
      '</body></html>';
    context.setHtmlBody(example);
    step(context);
    const expected =
      '<html><head></head><body>' +
      '<a href="https://www.example.com/home" class="external-link" target="_blank">Example</a>' +
      '<a href="https://www.google.com/about" class="external-link" target="_blank">Google</a>' +
      '</body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });
});
