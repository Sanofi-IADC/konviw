import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import { HttpService } from '@nestjs/axios';
import fixLinks from '../../../src/proxy-page/steps/fixLinks';
import { jiraMockServiceFactory } from '../mocks/jiraService';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / fixLinks', () => {
  let context: ContextService;
  let config: ConfigService;
  let http: HttpService;
  let webBasePath;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    http = moduleRef.get<HttpService>(HttpService);
    webBasePath = config.get('web.absoluteBasePath');

    context.initPageContext('XXX', '123456', 'dark');
  });

  it('should replace page absolute URLs', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
    const example =
      '<html><head></head><body>' +
      '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4242/Hello+World">test</a>' +
      '<a href="https://test.atlassian.net/wiki/spaces/XXX/pages/4343/Hello+World">test2</a>' +
      '</body></html>';
    context.setHtmlBody(example);
    await step(context);
    const expected =
      '<html><head></head><body><div id="Content">' +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4242/Hello+World">test</a>` +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4343/Hello+World">test2</a>` +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace page absolute URIs', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
    const example =
      '<html><head></head><body>' +
      '<a href="/wiki/spaces/XXX/pages/4242/Hello+World">test</a>' +
      '<a href="/wiki/spaces/XXX/pages/4343/Hello+World">test2</a>' +
      '</body></html>';
    context.setHtmlBody(example);
    await step(context);
    const expected =
      '<html><head></head><body><div id="Content">' +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4242/Hello+World">test</a>` +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4343/Hello+World">test2</a>` +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace page absolute URLs with Anchors and without title', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
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
    await step(context);
    const expected =
      '<html><head></head><body><div id="Content">' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4242/#HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">Hello World | Nulla tempus vitae ipsum vitae rhoncus.</a>` +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4343/#HelloWorld-ThisIsAnotherHeading">Hello World | This Is Another Heading</a>` +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace page absolute URLs with Anchors and respect original title', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
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
    await step(context);
    const expected =
      '<html><head></head><body><div id="Content">' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4242/#HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">test</a>` +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4343/#HelloWorld-ThisIsAnotherHeading">test2</a>` +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace page absolute URIs with Anchors and without title', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
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
    await step(context);
    const expected =
      '<html><head></head><body><div id="Content">' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4242/#HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">Hello World | Nulla tempus vitae ipsum vitae rhoncus.</a>` +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4343/#HelloWorld-ThisIsAnotherHeading">Hello World | This Is Another Heading</a>` +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace page absolute URIs with Anchors and respect original title', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
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
    await step(context);
    const expected =
      '<html><head></head><body><div id="Content">' +
      '<h2 id="HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h2> ' +
      '<h3 id="HelloWorld-ThisIsAnotherHeading">' +
      'Nulla tempus vitae ipsum vitae rhoncus.' +
      '</h3> ' +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4242/#HelloWorld-Nullatempusvitaeipsumvitaerhoncus.">test</a>` +
      `<a href="${webBasePath}/wiki/spaces/XXX/pages/4343/#HelloWorld-ThisIsAnotherHeading">test2</a>` +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should replace image URLs', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
    const example =
      '<html><head></head><body>' +
      '<img src="https://test.atlassian.net/wiki/download/thumbnails/241271570/image-20200312-161409.png?width=521&amp;height=196">' +
      '<img src="https://test.atlassian.net/wiki/download/thumbnails/241271571/image-20200312-161401.png?width=521&amp;height=196">' +
      '</body></html>';
    context.setHtmlBody(example);
    await step(context);
    const expected =
      '<html><head></head><body><div id="Content">' +
      `<img src="${webBasePath}/wiki/download/thumbnails/241271570/image-20200312-161409.png?width=521&amp;height=196">` +
      `<img src="${webBasePath}/wiki/download/thumbnails/241271571/image-20200312-161401.png?width=521&amp;height=196">` +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should open external links in a new tab', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
    const example =
      '<html><head></head><body>' +
      '<a href="https://www.example.com/home" class="external-link">Example</a>' +
      '<a href="https://www.google.com/about" class="external-link">Google</a>' +
      '</body></html>';
    context.setHtmlBody(example);
    await step(context);
    const expected =
      '<html><head></head><body><div id="Content">' +
      '<a href="https://www.example.com/home" class="external-link" target="_blank">Example</a>' +
      '<a href="https://www.google.com/about" class="external-link" target="_blank">Google</a>' +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should display data-appearance=inline links with a favicon', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
    const example =
    '<html><head></head><body>' +
    '<a data-card-appearance="inline" href="https://github.com/Sanofi-IADC/konviw" class="external-link">Example</a>' +
    '</body></html>';
    context.setHtmlBody(example);
    await step(context);
    const $ = context.getCheerioBody();
    expect($('#Content > a > img').attr('class')).toBe('favicon');
  });

  it('should display data-appearance=inline links without a favicon', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
    const example =
    '<html><head></head><body>' +
    '<a data-card-appearance="inline" href="https://www.google.com/about" class="external-link">Example</a>' +
    '</body></html>';
    context.setHtmlBody(example);
    await step(context);
    const $ = context.getCheerioBody();
    expect($('#Content > a > img').attr('class')).toBe('favicon hidden');
  });

  it('should display data-appearance=card links as a card', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
    const example =
    '<html><head></head><body>' +
    '<a data-card-appearance="block"  href="https://www.google.com/about" class="external-link">Example</a>' +
    '</body></html>';
    context.setHtmlBody(example);
    await step(context);
    const $ = context.getCheerioBody();
    expect($('#Content > div').attr('class')).toBe('card');
  });
  it('should display jira space link', async () => {
    const step = fixLinks(config, http, jiraMockServiceFactory);
    const example =
    '<html><head></head><body>' +
    '<a data-card-appearance="block" href="https://test.atlassian.net/jira/software/c/projects/KVW/boards/1" class="external-link"></a>' +
    '</body></html>';
    context.setHtmlBody(example);
    await step(context);
    const $ = context.getCheerioBody();
    expect($('img').attr('class')).toContain('jira-space-icon');
    expect($('a').text().trim()).toBe('Konviw');
  });
});
