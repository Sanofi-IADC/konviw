import { ConfluenceService } from '../../../src/confluence/confluence.service'
import configuration from '../../../src/config/configuration.test';
import { HttpModule } from '../../../src/http/http.module';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule} from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';


jest.mock('rxjs', () => {
  const original = jest.requireActual('rxjs');
  return {
    ...original,
    firstValueFrom: jest.fn(),
  };
});

describe('confluence.service', () => {
  let confluenceService: ConfluenceService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] }), HttpModule],
      providers: [ConfluenceService],
    }).compile();

    confluenceService = module.get<ConfluenceService>(ConfluenceService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(confluenceService).toBeDefined();
  });

  it('should call the service to get page using method getContentTypeBody with params get-draft true', async () => {
    const spyOn = jest.spyOn(confluenceService, 'getContentTypeBody');
    (firstValueFrom as any).mockImplementation(() => ({ data: { body: {}, results: [], authorId: '', version: { authorId: '' } }}))
    await confluenceService.getPage('space', '1234', 'type', 'draft');
    expect(spyOn).toHaveBeenCalledWith('blogposts', '1234', { version: 'type', 'space-id': null, 'get-draft': true });
  });

  it('should call the service to get page using method getContentTypeBody with params get-draft false', async () => {
    const spyOn = jest.spyOn(confluenceService, 'getContentTypeBody');
    (firstValueFrom as any).mockImplementation(() => ({ data: { body: {}, results: [], authorId: '', version: { authorId: '' } }}))
    await confluenceService.getPage('space', '1234', 'type', 'current');
    expect(spyOn).toHaveBeenCalledWith('blogposts', '1234', { version: 'type', 'space-id': null, 'get-draft': false });
  });

  it('should call the service to get page using method getContentTypeResource with params get-draft true', async () => {
    const spyOn = jest.spyOn(confluenceService, 'getContentTypeResource');
    (firstValueFrom as any).mockImplementation(() => ({ data: { body: {}, results: [], authorId: '', version: { authorId: '' } }}))
    await confluenceService.getPage('space', '1234', 'type', 'draft');
    expect(spyOn.mock.calls).toEqual([
      ['blogposts', '1234', 'labels', { 'get-draft': true, 'space-id': null, version: 'type' }],
      ['blogposts', '1234', 'properties', { 'get-draft': true, 'space-id': null, version: 'type' }]
    ]);
  });

  it('should call the service to get page using method getContentTypeResource with params get-draft false', async () => {
    const spyOn = jest.spyOn(confluenceService, 'getContentTypeResource');
    (firstValueFrom as any).mockImplementation(() => ({ data: { body: {}, results: [], authorId: '', version: { authorId: '' } }}))
    await confluenceService.getPage('space', '1234', 'type', 'current');
    expect(spyOn.mock.calls).toEqual([
      ['blogposts', '1234', 'labels', { 'get-draft': false, 'space-id': null, version: 'type' }],
      ['blogposts', '1234', 'properties', { 'get-draft': false, 'space-id': null, version: 'type' }]
    ]);
  });
});
