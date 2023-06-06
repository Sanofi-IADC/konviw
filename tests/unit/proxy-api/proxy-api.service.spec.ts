import { Test, TestingModule } from '@nestjs/testing';
import { ProxyApiService } from '../../../src/proxy-api/proxy-api.service';
import { ContextService } from '../../../src/context/context.service';
import { ConfluenceService } from '../../../src/confluence/confluence.service';
import { JiraService } from '../../../src/jira/jira.service';
import { HttpModule } from '../../../src/http/http.module';
import { ConfigModule } from '@nestjs/config';
import { Content } from '../../../src/confluence/confluence.interface';
import configuration from '../../../src/config/configuration.test';
import { GoogleAnalyticsService } from '../../../src/google-analytics/google-analytics.service';
import { GoogleAnalyticsReportParams } from '../../../src/google-analytics/types/getGoogleAnalyticsReport.type';

jest.mock('../../../src/confluence/confluence.service');
jest.mock('../../../src/jira/jira.service');

// eslint-disable-next-line @typescript-eslint/ban-types
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

class ConfluenceServiceMock {
  getPage(spaceKey: string, pageId: string, version?: string): DeepPartial<Content>{

    const confluenceContent: DeepPartial<Content> = {
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

    return confluenceContent
  }
}

class GoogleAnalyticsServiceMock {
  getGoogleAnalyticsReport(id: string, params: GoogleAnalyticsReportParams): DeepPartial<Content>{
    return {
      dimensionHeaders: [
        {
          name: 'date',
        },
      ],
      metricHeaders: [
        {
          name: 'activeUsers',
          type: 'TYPE_INTEGER',
        },
        {
          name: 'totalUsers',
          type: 'TYPE_INTEGER',
        },
      ],
      rows: [
        {
          dimensionValues: [
            {
              value: '20230321',
              oneValue: 'value',
            },
          ],
          metricValues: [
            {
              value: '363',
              oneValue: 'value',
            },
            {
              value: '382',
              oneValue: 'value',
            },
          ],
        },
      ],
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
    const GoogleAnalyticsServiceProvider = {
      provide: GoogleAnalyticsService,
      useClass: GoogleAnalyticsServiceMock,
    };
    app = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] }), HttpModule],
      providers: [
        ContextService,
        ConfluenceServiceProvider,
        ProxyApiService,
        JiraService,
        GoogleAnalyticsServiceProvider,
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

    it('should call getGoogleAnalyticsReport construct the google analytics report including mandatory fields', async () => {
      jest.spyOn(proxyApiService, 'getGoogleAnalyticsReport');
      const results = await proxyApiService.getGoogleAnalyticsReport('123', '2023-05-05', '2023-05-07', {});
      expect(proxyApiService.getGoogleAnalyticsReport).toHaveBeenCalledTimes(1);
      expect(results.dimensionHeaders).toBeDefined();
      expect(results.metricHeaders).toBeDefined();
      expect(results.rows).toBeDefined();
    });
  });
});
