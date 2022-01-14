import { Test, TestingModule } from '@nestjs/testing';
// import { ApiService } from '../api.service';
import { ProxyApiService } from '../../../src/proxy-api/proxy-api.service';
import { ContextService } from '../../../src/context/context.service';
import { ConfluenceService } from '../../../src/confluence/confluence.service';
import { JiraService } from '../../../src/jira/jira.service';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { Content } from '../../../src/confluence/confluence.interface';
import configuration from '../../../src/config/configuration.test';

jest.mock('../../../src/confluence/confluence.service');
jest.mock('../../../src/jira/jira.service');

class ConfluenceServiceMock {
  getPage(spaceKey: string, pageId: string) {
    const mockedResponse = {
      data: {
        name: 'Jane Doe',
        grades: [3.7, 3.8, 3.9, 4.0, 3.6],
        title: 'www',
        author: 'fart',
        history: {
          createdBy: {
            email: 'poo@poo.poo',
            displayName: 'poo',
            profilePicture: {
              path: 'asda',
            },
          },
          createdDate: '111',
        },
        body: { view: { value: 'asddd' } },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    };

    return mockedResponse;
  }
}

describe('StudentService', () => {
  let app: TestingModule;
  let proxyApiService: ProxyApiService;
  //   let confluenceService: ConfluenceService;
  //   let jiraService: JiraService;
  let configService: ConfigService;
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
    it('should return page author', async () => {
      const result = await proxyApiService.getPage('space', '1234', 'type');

      expect(result).toHaveProperty('author');
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
  });
});
