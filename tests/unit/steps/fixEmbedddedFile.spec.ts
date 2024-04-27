import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';
import fixEmbeddedFile from '../../../src/proxy-page/steps/fixEmbeddedFile';

describe('ConfluenceProxy / fixEmbeddedFile', () => {
  let context: ContextService;

  const embeddedFile = '<span class="confluence-embedded-file-wrapper conf-macro output-inline">' +
                        '<a class="confluence-embedded-file" ' +
                          'href="http://localhost:4000/cpv/wiki/download/attachments/64425626715/file-name.pdf" ' +
                          'data-nice-type="PDF Document" data-linked-resource-default-alias="file-name.pdf" ' +
                          'data-mime-type="application/pdf" data-has-thumbnail="true" data-linked-resource-version="1" ' +
                          'data-media-id="8601b073-105d-4f4a-90d1-82d45cfd3263" data-media-type="file">' +
                          '<img src="http://localhost:4000/cpv/wiki/download/thumbnails/64425626715/file-name.pdf" height="250">' +
                        '</a>'+
                      '</span>'

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'XXX', '123456', 'dark');
  });

  it('should display thumbnail', () => {
    const step = fixEmbeddedFile();
    const example =
    '<html><head></head><body>' +
      '<p class="media-group">' + embeddedFile + '</p>' +
    '</body></html>';

    context.setHtmlBody(example);
    step(context);
    const expected = '<html><head></head><body>' +
      '<div id="Content">' +
        '<div class="konviw-embedded-file">' +
          '<p class="media-group">' +
            '<span class="confluence-embedded-file-wrapper conf-macro output-inline">' +
              '<a class="confluence-embedded-file" '+
                'href="http://localhost:4000/cpv/wiki/download/attachments/64425626715/file-name.pdf" ' +
                'data-nice-type="PDF Document" data-linked-resource-default-alias="file-name.pdf" ' +
                'data-mime-type="application/pdf" data-has-thumbnail="true" data-linked-resource-version="1" ' +
                'data-media-id="8601b073-105d-4f4a-90d1-82d45cfd3263" data-media-type="file">' +
                '<img src="http://localhost:4000/cpv/wiki/download/thumbnails/64425626715/file-name.pdf" height="250">' +
              '</a>' +
            '</span>' +
            '<span class="konviw-embedded-file-caption">file-name.pdf</span>' +
          '</p>' +
        '</div>' +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should display inline', () => {
    const step = fixEmbeddedFile();
    const example =
    '<html><head></head><body>' +
      '<p>' + embeddedFile + '</p>' +
    '</body></html>';

    context.setHtmlBody(example);
    step(context);
    const expected = '<html><head></head><body>' +
      '<div id="Content">' +
        '<p>' +
          '<span class="confluence-embedded-file-wrapper conf-macro output-inline">' +
            '<a class="confluence-embedded-file konviw-embedded-file-icon" '+
              'href="http://localhost:4000/cpv/wiki/download/attachments/64425626715/file-name.pdf" ' +
              'data-nice-type="PDF Document" data-linked-resource-default-alias="file-name.pdf" ' +
              'data-mime-type="application/pdf" data-has-thumbnail="true" data-linked-resource-version="1" ' +
              'data-media-id="8601b073-105d-4f4a-90d1-82d45cfd3263" data-media-type="file">' +
              'file-name.pdf' +
            '</a>' +
          '</span>' +
        '</p>' +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });

  it('should display one inline and one thumbnail', () => {
    const step = fixEmbeddedFile();
    const example =
    '<html><head></head><body>' +
      '<p>' + embeddedFile + '</p>' +
      '<p class="media-group">' + embeddedFile + '</p>' +
    '</body></html>';

    context.setHtmlBody(example);
    step(context);
    const expected = '<html><head></head><body>' +
      '<div id="Content">' +
        '<p>' +
          '<span class="confluence-embedded-file-wrapper conf-macro output-inline">' +
            '<a class="confluence-embedded-file konviw-embedded-file-icon" '+
              'href="http://localhost:4000/cpv/wiki/download/attachments/64425626715/file-name.pdf" ' +
              'data-nice-type="PDF Document" data-linked-resource-default-alias="file-name.pdf" ' +
              'data-mime-type="application/pdf" data-has-thumbnail="true" data-linked-resource-version="1" ' +
              'data-media-id="8601b073-105d-4f4a-90d1-82d45cfd3263" data-media-type="file">' +
              'file-name.pdf' +
            '</a>' +
          '</span>' +
        '</p>' +
        '<div class="konviw-embedded-file">' +
          '<p class="media-group">' +
            '<span class="confluence-embedded-file-wrapper conf-macro output-inline">' +
              '<a class="confluence-embedded-file" '+
                'href="http://localhost:4000/cpv/wiki/download/attachments/64425626715/file-name.pdf" ' +
                'data-nice-type="PDF Document" data-linked-resource-default-alias="file-name.pdf" ' +
                'data-mime-type="application/pdf" data-has-thumbnail="true" data-linked-resource-version="1" ' +
                'data-media-id="8601b073-105d-4f4a-90d1-82d45cfd3263" data-media-type="file">' +
                '<img src="http://localhost:4000/cpv/wiki/download/thumbnails/64425626715/file-name.pdf" height="250">' +
              '</a>' +
            '</span>' +
            '<span class="konviw-embedded-file-caption">file-name.pdf</span>' +
          '</p>' +
        '</div>' +
      '</div></body></html>';
    expect(context.getHtmlBody()).toEqual(expected);
  });


});
