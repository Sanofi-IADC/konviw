import { ConfluenceService } from '../../../src/confluence/confluence.service'
import configuration from '../../../src/config/configuration.test';
import { HttpModule } from '../../../src/http/http.module';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule} from '@nestjs/testing';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] }), HttpModule],
      providers: [ConfluenceService],
    }).compile();

    confluenceService = module.get<ConfluenceService>(ConfluenceService);
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

  describe('getRedirectUrlForMedia', () => {
    const signedUrl = 'https://media-download.confluence-data.com/file?signature=abc';

    beforeEach(() => {
      (firstValueFrom as any).mockReset();
    });

    it('resolves an attachment uri via v2 lookup + v1 attachment/download', async () => {
      const httpGet = jest.spyOn(confluenceService['http'], 'get');
      (firstValueFrom as any)
        .mockResolvedValueOnce({ data: { results: [{ id: 'att42' }] } })
        .mockResolvedValueOnce({ headers: { location: signedUrl } });

      const result = await confluenceService.getRedirectUrlForMedia(
        'download/attachments/1234/file.png?api=v2',
      );

      expect(result).toBe(signedUrl);
      expect(httpGet).toHaveBeenNthCalledWith(
        1,
        '/wiki/api/v2/pages/1234/attachments',
        { params: { filename: 'file.png', limit: 1 } },
      );
      const secondCall = httpGet.mock.calls[1];
      expect(secondCall[0]).toBe('/wiki/rest/api/content/1234/child/attachment/att42/download');
      expect(secondCall[1]).toMatchObject({ maxRedirects: 0 });
      expect(typeof (secondCall[1] as any).validateStatus).toBe('function');
      expect((secondCall[1] as any).validateStatus(302)).toBe(true);
      expect((secondCall[1] as any).validateStatus(200)).toBe(false);
    });

    it('resolves a thumbnail uri via the same path (no /thumbnails/ -> /attachments/ swap needed)', async () => {
      const httpGet = jest.spyOn(confluenceService['http'], 'get');
      (firstValueFrom as any)
        .mockResolvedValueOnce({ data: { results: [{ id: 'att99' }] } })
        .mockResolvedValueOnce({ headers: { location: signedUrl } });

      const result = await confluenceService.getRedirectUrlForMedia(
        'download/thumbnails/5678/photo.jpg?version=1&width=544&height=229&api=v2',
      );

      expect(result).toBe(signedUrl);
      expect(httpGet).toHaveBeenNthCalledWith(
        1,
        '/wiki/api/v2/pages/5678/attachments',
        { params: { filename: 'photo.jpg', limit: 1 } },
      );
      expect(httpGet.mock.calls[1][0]).toBe(
        '/wiki/rest/api/content/5678/child/attachment/att99/download',
      );
    });

    it('url-decodes the filename before the v2 lookup', async () => {
      const httpGet = jest.spyOn(confluenceService['http'], 'get');
      (firstValueFrom as any)
        .mockResolvedValueOnce({ data: { results: [{ id: 'att1' }] } })
        .mockResolvedValueOnce({ headers: { location: signedUrl } });

      await confluenceService.getRedirectUrlForMedia(
        'download/attachments/100/my%20file%20(v2).png?api=v2',
      );

      expect(httpGet).toHaveBeenNthCalledWith(
        1,
        '/wiki/api/v2/pages/100/attachments',
        { params: { filename: 'my file (v2).png', limit: 1 } },
      );
    });

    it('throws 404 when no attachment matches the filename', async () => {
      (firstValueFrom as any).mockResolvedValueOnce({ data: { results: [] } });

      await expect(
        confluenceService.getRedirectUrlForMedia('download/attachments/1/missing.png'),
      ).rejects.toBeInstanceOf(HttpException);
      await expect(
        confluenceService.getRedirectUrlForMedia('download/attachments/1/missing.png'),
      ).rejects.toHaveProperty('status', 404);
    });

    it('throws 404 when the v1 attachment/download response is not a 302', async () => {
      (firstValueFrom as any)
        .mockResolvedValueOnce({ data: { results: [{ id: 'att1' }] } })
        .mockRejectedValueOnce(new Error('Request failed with status code 401'));

      await expect(
        confluenceService.getRedirectUrlForMedia('download/attachments/1/file.png'),
      ).rejects.toHaveProperty('status', 404);
    });

    it('falls back to a direct /wiki/{uri} passthrough for non-download uris (e.g. aa-avatar)', async () => {
      const httpGet = jest.spyOn(confluenceService['http'], 'get');
      (firstValueFrom as any).mockResolvedValueOnce({ headers: { location: signedUrl } });

      const result = await confluenceService.getRedirectUrlForMedia(
        'aa-avatar/5da80c30f273020c44682e47',
      );

      expect(result).toBe(signedUrl);
      const call = httpGet.mock.calls[0];
      expect(call[0]).toBe('/wiki/aa-avatar/5da80c30f273020c44682e47');
      expect(call[1]).toMatchObject({ maxRedirects: 0 });
      expect(typeof (call[1] as any).validateStatus).toBe('function');
      expect((call[1] as any).validateStatus(302)).toBe(true);
    });

    it('also accepts a v2 downloadLink shape with leading slash', async () => {
      const httpGet = jest.spyOn(confluenceService['http'], 'get');
      (firstValueFrom as any)
        .mockResolvedValueOnce({ data: { results: [{ id: 'attXX' }] } })
        .mockResolvedValueOnce({ headers: { location: signedUrl } });

      const result = await confluenceService.getRedirectUrlForMedia(
        '/download/attachments/246153217/test.pdf?version=1&modificationDate=1692603703844&cacheVersion=1&api=v2',
      );

      expect(result).toBe(signedUrl);
      expect(httpGet).toHaveBeenNthCalledWith(
        1,
        '/wiki/api/v2/pages/246153217/attachments',
        { params: { filename: 'test.pdf', limit: 1 } },
      );
    });
  });

  describe('getAttachmentBase64', () => {
    const signedUrl = 'https://api.media.atlassian.com/file/abc/binary?token=t';

    beforeEach(() => {
      (firstValueFrom as any).mockReset();
    });

    it('resolves the media uri and returns the base64-encoded bytes', async () => {
      jest.spyOn(confluenceService, 'getRedirectUrlForMedia').mockResolvedValueOnce(signedUrl);
      const axiosDefault = jest.requireActual('axios').default;
      const axiosGetSpy = jest.spyOn(axiosDefault, 'get').mockResolvedValueOnce({
        data: Buffer.from('%PDF-1.4 hello', 'utf8'),
      } as any);

      const result = await confluenceService.getAttachmentBase64(
        '/download/attachments/1/test.pdf?api=v2',
      );

      expect(axiosGetSpy).toHaveBeenCalledWith(signedUrl, { responseType: 'arraybuffer' });
      expect(result).toBe(Buffer.from('%PDF-1.4 hello', 'utf8').toString('base64'));
    });

    it('returns undefined when the underlying media resolution fails', async () => {
      jest
        .spyOn(confluenceService, 'getRedirectUrlForMedia')
        .mockRejectedValueOnce(new HttpException('error:getRedirectUrlForMedia', 404));

      const result = await confluenceService.getAttachmentBase64(
        '/download/attachments/1/missing.pdf?api=v2',
      );

      expect(result).toBeUndefined();
    });
  });
});
