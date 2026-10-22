import { HealthCheckError } from '@nestjs/terminus';
import { ApiHealthService } from '../../../src/health/health-atlassian.service';

const UP = { 'Atlassian API': { status: 'up', message: 'up' } };

describe('ApiHealthService', () => {
  const search = jest.fn();
  let service: ApiHealthService;

  const hang = () => new Promise<void>(() => { /* never resolves */ });

  beforeEach(() => {
    jest.useFakeTimers();
    search.mockReset();
    service = new ApiHealthService({ Search: search } as any);
  });

  afterEach(() => jest.useRealTimers());

  it('reports up and queries Atlassian with a single result', async () => {
    search.mockResolvedValue({});
    await expect(service.apiCheck()).resolves.toEqual(UP);
    expect(search).toHaveBeenCalledWith('konviw', undefined, undefined, undefined, 1);
  });

  it('reuses a recent success without calling Atlassian again', async () => {
    search.mockResolvedValue({});
    await service.apiCheck();
    await service.apiCheck();
    expect(search).toHaveBeenCalledTimes(1);
  });

  it('checks again once the cache has expired', async () => {
    search.mockResolvedValue({});
    await service.apiCheck();
    await jest.advanceTimersByTimeAsync(61_000);
    await service.apiCheck();
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('shares one search between concurrent probes', async () => {
    let resolveSearch: (v?: unknown) => void;
    search.mockReturnValue(new Promise((r) => { resolveSearch = r; }));
    const probes = [service.apiCheck(), service.apiCheck(), service.apiCheck()];
    resolveSearch({});
    await expect(Promise.all(probes)).resolves.toEqual([UP, UP, UP]);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it('reports down when Atlassian errors', async () => {
    search.mockRejectedValue(new Error('401'));
    await expect(service.apiCheck()).rejects.toBeInstanceOf(HealthCheckError);
  });

  it('does not tolerate an error even right after a success', async () => {
    search.mockResolvedValueOnce({});
    await service.apiCheck();
    await jest.advanceTimersByTimeAsync(61_000);
    search.mockRejectedValue(new Error('500'));
    await expect(service.apiCheck()).rejects.toBeInstanceOf(HealthCheckError);
  });

  it('recovers after a failure', async () => {
    search.mockRejectedValueOnce(new Error('500'));
    await expect(service.apiCheck()).rejects.toBeInstanceOf(HealthCheckError);
    search.mockResolvedValue({});
    await expect(service.apiCheck()).resolves.toEqual(UP);
  });

  it('reports down on timeout when there was no recent success', async () => {
    search.mockReturnValue(hang());
    const assertion = expect(service.apiCheck()).rejects.toBeInstanceOf(HealthCheckError);
    await jest.advanceTimersByTimeAsync(8_000);
    await assertion;
  });

  it('tolerates a timeout shortly after a success', async () => {
    search.mockResolvedValueOnce({});
    await service.apiCheck();
    await jest.advanceTimersByTimeAsync(61_000);
    search.mockReturnValue(hang());
    const check = service.apiCheck();
    await jest.advanceTimersByTimeAsync(8_000);
    await expect(check).resolves.toEqual(UP);
  });

  it('stops tolerating timeouts after 5 minutes without a success', async () => {
    search.mockResolvedValueOnce({});
    await service.apiCheck();
    await jest.advanceTimersByTimeAsync(5 * 60_000 + 1_000);
    search.mockReturnValue(hang());
    const assertion = expect(service.apiCheck()).rejects.toBeInstanceOf(HealthCheckError);
    await jest.advanceTimersByTimeAsync(8_000);
    await assertion;
  });

  it('starts a new search after a hung one timed out', async () => {
    search.mockReturnValueOnce(hang());
    const first = expect(service.apiCheck()).rejects.toBeInstanceOf(HealthCheckError);
    await jest.advanceTimersByTimeAsync(8_000);
    await first;
    search.mockResolvedValue({});
    await expect(service.apiCheck()).resolves.toEqual(UP);
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('uses a search that finishes after the timeout for the next probe', async () => {
    let resolveSearch: (v?: unknown) => void;
    search.mockReturnValueOnce(new Promise((r) => { resolveSearch = r; }));
    const first = expect(service.apiCheck()).rejects.toBeInstanceOf(HealthCheckError);
    await jest.advanceTimersByTimeAsync(8_000);
    await first;
    resolveSearch({});
    await jest.advanceTimersByTimeAsync(0);
    await expect(service.apiCheck()).resolves.toEqual(UP);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it('does not raise an unhandled rejection when a search fails after the timeout', async () => {
    let rejectSearch: (e: Error) => void;
    search.mockReturnValueOnce(new Promise((_, rej) => { rejectSearch = rej; }));
    const first = expect(service.apiCheck()).rejects.toBeInstanceOf(HealthCheckError);
    await jest.advanceTimersByTimeAsync(8_000);
    await first;
    rejectSearch(new Error('late failure'));
    await jest.advanceTimersByTimeAsync(0);
  });
});
