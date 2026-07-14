import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ProxyPageService } from '../../../src/proxy-page/proxy-page.service';
import { ContextService } from '../../../src/context/context.service';
import { ConfluenceService } from '../../../src/confluence/confluence.service';
import { JiraService } from '../../../src/jira/jira.service';
import { XrayService } from '../../../src/xray/xray.service';
import { HttpModule } from '../../../src/http/http.module';
import { Content } from '../../../src/confluence/confluence.interface';
import configuration from '../../../src/config/configuration.test';

jest.mock('../../../src/confluence/confluence.service');
jest.mock('../../../src/jira/jira.service');

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// A v2-shaped Confluence page with a plain body. The minimal DOM keeps every
// content-driven step (jira macros, emojis, space links, PDFs, attachments) on
// its no-op branch, so renderPage completes without hitting external services.
class ConfluenceServiceMock {
  // eslint-disable-next-line class-methods-use-this
  getPage(): DeepPartial<Content> {
    return {
      pageContent: {
        title: 'Page title',
        body: {
          view: { value: '<p>plain body content</p>' },
          storage: { value: '<p>plain body content</p>' },
        },
        version: { number: 21, createdAt: '2021-01-19T01:30:00.000' },
        createdAt: '2020-01-01T01:30:00.000',
      },
      authorContent: {
        email: 'email@somewhere.com',
        publicName: 'Author name',
        profilePicture: { path: '//profilepic' },
      },
      versionAuthorContent: {
        email: 'email@somewhere.com',
        publicName: 'Author name',
        profilePicture: { path: '//profilepic' },
      },
      spaceContent: { key: 'MySpace' },
      labelsContent: { results: [{ name: 'one' }] },
      propertiesContent: {},
    };
  }

  // eslint-disable-next-line class-methods-use-this
  getAttachments() {
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  getSpecialAtlassianIcons() {
    return '';
  }

  // eslint-disable-next-line class-methods-use-this
  getSpecialUploadedIcons() {
    return '';
  }

  // eslint-disable-next-line class-methods-use-this
  getSpaceMetadata() {
    return { data: {} };
  }
}

describe('proxy-page.service', () => {
  let app: TestingModule;
  let proxyPageService: ProxyPageService;

  const renderOnce = () =>
    proxyPageService.renderPage(
      'MySpace',
      '1234',
      '', // version
      'light', // theme
      'page', // type
      'konviw', // style
      'fullpage', // view (enables reading-progress bar)
      'current', // status
    );

  const countOccurrences = (haystack: string, needle: string): number =>
    haystack.split(needle).length - 1;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] }), HttpModule],
      providers: [
        ProxyPageService,
        ContextService,
        { provide: ConfluenceService, useClass: ConfluenceServiceMock },
        {
          provide: JiraService,
          useValue: { getFields: jest.fn().mockResolvedValue([]) },
        },
        { provide: XrayService, useValue: { getAttachment: jest.fn() } },
      ],
    }).compile();
    proxyPageService = app.get<ProxyPageService>(ProxyPageService);
  });

  it('renders a single title and reading-progress bar for a sequential request', async () => {
    const html = await renderOnce();
    expect(countOccurrences(html, '<h1 class="titlePage">')).toBe(1);
    expect(countOccurrences(html, 'id="reading-progress"')).toBe(1);
  });

  it('does not duplicate the title or reading-progress bar under concurrent requests', async () => {
    // Regression: the render buffer used to live on a shared singleton
    // ContextService, so overlapping renderPage calls accumulated copies of the
    // <h1 class="titlePage"> and <div id="reading-progress"> nodes. Each call
    // must now own an isolated context.
    const results = await Promise.all(Array.from({ length: 6 }, renderOnce));

    results.forEach((html) => {
      expect(countOccurrences(html, '<h1 class="titlePage">')).toBe(1);
      expect(countOccurrences(html, 'id="reading-progress"')).toBe(1);
    });
  });
});
