import { Test, TestingModule } from '@nestjs/testing';
import { ProxyApiService } from '../../../src/proxy-api/proxy-api.service';
import { ContextService } from '../../../src/context/context.service';
import { ConfluenceService } from '../../../src/confluence/confluence.service';
import { JiraService } from '../../../src/jira/jira.service';
import { ConfigModule } from '@nestjs/config';
import { Content } from '../../../src/confluence/confluence.interface';
import configuration from '../../../src/config/configuration.test';

jest.mock('../../../src/confluence/confluence.service');
jest.mock('../../../src/jira/jira.service');

class ConfluenceServiceMock {
  getPage(spaceKey: string, pageId: string) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    type DeepPartial<T> = T extends object
      ? { [P in keyof T]?: DeepPartial<T[P]> }
      : T;

    const confluenceResponse: DeepPartial<Content> = {
      title: 'Page title',
      history: {
        createdBy: {
          email: 'email@somewhere.com',
          displayName: 'Author name',
          profilePicture: {
            path: '//profilepic',
          },
        },
        createdDate: '2020-01-01T01:30:00.000',
      },
      body: { view: { value: '<Content>page content</Content>' } },
      version: { number: 21, friendlyWhen: '19 January 2021', by: { publicName: 'Name LastName' } },
      _expandable: {space: '/rest/api/space/MySpace'},
      metadata: {
        labels: {results: [{name: 'one'},{name: 'two'},{name: 'three'}]},
        properties: {}
      }
    };

    return {
      data: confluenceResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }
}

describe('proxy-api.service', () => {
  let app: TestingModule;
  let proxyApiService: ProxyApiService;
  let contextService: ContextService;

  beforeAll(async () => {
    const ConfluenceServiceProvider = {
      provide: ConfluenceService,
      useClass: ConfluenceServiceMock,
    };
    app = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] })],
      providers: [
        ContextService,
        ConfluenceServiceProvider,
        ProxyApiService,
        JiraService,
      ],
    }).compile();
    proxyApiService = app.get<ProxyApiService>(ProxyApiService);
    contextService = app.get<ContextService>(ContextService);
  });

  describe('getPage', () => {
    it('should return page author (createdBy)', async () => {
      const result = await proxyApiService.getPage('space', '1234', 'type');

      expect(result).toHaveProperty('createdBy');
    });

    it('should call the Confluence service to get page data', async () => {
      jest.spyOn(proxyApiService, 'getPage');
      await proxyApiService.getPage('space', '1234', 'type');

      expect(proxyApiService.getPage).toHaveBeenCalledTimes(1);
    });

    it('should call initPageContext construct the basic page context', async () => {
      jest.spyOn(contextService, 'initPageContext');
      await proxyApiService.getPage('space', '1234', 'type');

      expect(contextService.initPageContext).toHaveBeenCalledTimes(1);
    });

    it('should not call addLibrariesCSS as CSS cannot be injected by setting innerHTML', async () => {
      const addLibrariesCSS = jest.requireActual(
        '../../../src/proxy-page/steps/addLibrariesCSS',
      );
      jest.spyOn(addLibrariesCSS, 'default');

      await proxyApiService.getPage('space', '1234', 'type');
      expect(addLibrariesCSS.default).not.toHaveBeenCalled();
    });

    it('should not call addLibrariesJS as JS scripts cannot be injected by setting innerHTML', async () => {
      const addLibrariesJS = jest.requireActual(
        '../../../src/proxy-page/steps/addLibrariesJS',
      );
      jest.spyOn(addLibrariesJS, 'default');

      await proxyApiService.getPage('space', '1234', 'type');
      expect(addLibrariesJS.default).not.toHaveBeenCalled();
    });
  });
});
