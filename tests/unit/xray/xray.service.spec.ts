import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import configuration from '../../../src/config/configuration.test';
import { XrayService } from '../../../src/xray/xray.service';

describe('xray.service', () => {
  let xrayService: XrayService;
  let httpService: { post: jest.Mock; get: jest.Mock };

  const buildService = async (clientId = 'id', clientSecret = 'secret') => {
    httpService = { post: jest.fn(), get: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ...configuration(),
              xray: {
                baseURL: 'https://xray.cloud.getxray.app/api/v2',
                clientId,
                clientSecret,
              },
            }),
          ],
        }),
      ],
      providers: [
        XrayService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();
    xrayService = module.get<XrayService>(XrayService);
  };

  const graphqlPage = (results: any[], total: number) => of({
    data: { data: { getTestRuns: { total, limit: 100, start: 0, results } } },
  });

  it('authenticates once and returns the batched test runs', async () => {
    await buildService();
    httpService.post
      .mockReturnValueOnce(of({ data: '"a-bearer-token"' }))
      .mockReturnValueOnce(graphqlPage([
        { id: 'run-1', status: { name: 'PASSED' }, test: { issueId: '20001' } },
        { id: 'run-2', status: { name: 'FAILED' }, test: { issueId: '20002' } },
      ], 2));

    const runs = await xrayService.getTestRunsByTestIds(['20001', '20002']);

    expect(runs).toHaveLength(2);
    expect(runs[0].id).toBe('run-1');
    // First call authenticates, second queries GraphQL with a Bearer token.
    const authCall = httpService.post.mock.calls[0];
    expect(authCall[0]).toContain('/authenticate');
    expect(authCall[1]).toEqual({ client_id: 'id', client_secret: 'secret' });
    const graphqlCall = httpService.post.mock.calls[1];
    expect(graphqlCall[0]).toContain('/graphql');
    expect(graphqlCall[2].headers.Authorization).toBe('Bearer a-bearer-token');
    expect(graphqlCall[1].query).toContain('testIssueIds: ["20001", "20002"]');
  });

  it('paginates beyond the 100-item page limit', async () => {
    await buildService();
    const firstPage = Array.from({ length: 100 }, (_, i) => ({
      id: `run-${i}`, test: { issueId: '20001' },
    }));
    const secondPage = [{ id: 'run-100', test: { issueId: '20001' } }];
    httpService.post
      .mockReturnValueOnce(of({ data: '"a-bearer-token"' }))
      .mockReturnValueOnce(graphqlPage(firstPage, 101))
      .mockReturnValueOnce(graphqlPage(secondPage, 101));

    const runs = await xrayService.getTestRunsByTestIds(['20001']);

    expect(runs).toHaveLength(101);
    // auth + 2 graphql pages
    expect(httpService.post).toHaveBeenCalledTimes(3);
    expect(httpService.post.mock.calls[2][1].query).toContain('start: 100');
  });

  it('returns an empty array and skips network calls when not configured', async () => {
    await buildService('', '');
    const runs = await xrayService.getTestRunsByTestIds(['20001']);
    expect(runs).toEqual([]);
    expect(httpService.post).not.toHaveBeenCalled();
  });

  it('returns an empty array without calling the API when no ids are given', async () => {
    await buildService();
    const runs = await xrayService.getTestRunsByTestIds([]);
    expect(runs).toEqual([]);
    expect(httpService.post).not.toHaveBeenCalled();
  });

  it('returns an empty array when the API call fails', async () => {
    await buildService();
    httpService.post.mockImplementationOnce(() => {
      throw new Error('network down');
    });
    const runs = await xrayService.getTestRunsByTestIds(['20001']);
    expect(runs).toEqual([]);
  });

  it('reuses the cached bearer token across calls (authenticates only once)', async () => {
    await buildService();
    httpService.post
      .mockReturnValueOnce(of({ data: '"a-bearer-token"' }))
      .mockReturnValue(graphqlPage([{ id: 'run-1', test: { issueId: '20001' } }], 1));

    await xrayService.getTestRunsByTestIds(['20001']);
    await xrayService.getTestRunsByTestIds(['20002']);

    const authCalls = httpService.post.mock.calls.filter((call) => String(call[0]).includes('/authenticate'));
    expect(authCalls).toHaveLength(1);
  });

  it('stops paginating when a page returns no results even if total is higher', async () => {
    await buildService();
    httpService.post
      .mockReturnValueOnce(of({ data: '"a-bearer-token"' }))
      .mockReturnValueOnce(graphqlPage([{ id: 'run-1', test: { issueId: '20001' } }], 500))
      .mockReturnValueOnce(graphqlPage([], 500));

    const runs = await xrayService.getTestRunsByTestIds(['20001']);

    expect(runs).toHaveLength(1);
    // auth + first (non-empty) page + second (empty) page, then it breaks
    expect(httpService.post).toHaveBeenCalledTimes(3);
  });

  it('escapes the test issue ids injected into the GraphQL query', async () => {
    await buildService();
    httpService.post
      .mockReturnValueOnce(of({ data: '"a-bearer-token"' }))
      .mockReturnValueOnce(graphqlPage([], 0));

    await xrayService.getTestRunsByTestIds(['20001', 'evil" injection']);

    const { query } = httpService.post.mock.calls[1][1];
    // The rogue quote must be escaped so it cannot break out of the string.
    expect(query).toContain('"20001"');
    expect(query).toContain('evil\\" injection');
    expect(query).not.toContain('"evil" injection"');
  });

  it('downloads an attachment with the bearer token and preserves the content type', async () => {
    await buildService();
    httpService.post.mockReturnValueOnce(of({ data: '"a-bearer-token"' }));
    httpService.get.mockReturnValueOnce(of({
      data: Buffer.from('PNG-BYTES'),
      headers: { 'content-type': 'image/png' },
    }));

    const result = await xrayService.getAttachment('att-123');

    expect(result.contentType).toBe('image/png');
    expect(Buffer.isBuffer(result.data)).toBe(true);
    const getCall = httpService.get.mock.calls[0];
    expect(getCall[0]).toContain('/attachments/att-123');
    expect(getCall[1].headers.Authorization).toBe('Bearer a-bearer-token');
    expect(getCall[1].responseType).toBe('arraybuffer');
  });

  it('sniffs the content type when Xray returns a generic octet-stream', async () => {
    await buildService();
    httpService.post.mockReturnValueOnce(of({ data: '"a-bearer-token"' }));
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    httpService.get.mockReturnValueOnce(of({
      data: png,
      headers: { 'content-type': 'application/octet-stream' },
    }));

    const result = await xrayService.getAttachment('att-1');

    expect(result.contentType).toBe('image/png');
  });

  it('throws and makes no request when downloading an attachment while unconfigured', async () => {
    await buildService('', '');
    await expect(xrayService.getAttachment('att-123')).rejects.toThrow();
    expect(httpService.get).not.toHaveBeenCalled();
  });
});
