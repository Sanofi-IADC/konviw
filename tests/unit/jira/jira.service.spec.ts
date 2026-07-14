import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import configuration from '../../../src/config/configuration.test';
import { JiraService } from '../../../src/jira/jira.service';

describe('jira.service / getUsersByAccountIds', () => {
  let jiraService: JiraService;
  let httpService: { get: jest.Mock };

  const buildService = async () => {
    httpService = { get: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] })],
      providers: [
        JiraService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();
    jiraService = module.get<JiraService>(JiraService);
  };

  const userResponse = (values: any[]) => of({ data: { values } });

  it('resolves account ids to a map keyed by accountId', async () => {
    await buildService();
    httpService.get.mockReturnValueOnce(userResponse([
      { accountId: 'a1', displayName: 'Alice', emailAddress: 'alice@test.com', self: 'https://s/a1' },
      { accountId: 'a2', displayName: 'Bob', emailAddress: 'bob@test.com', self: 'https://s/a2' },
    ]));

    const users = await jiraService.getUsersByAccountIds(['a1', 'a2']);

    expect(users.a1.displayName).toBe('Alice');
    expect(users.a2.displayName).toBe('Bob');
    const url = String(httpService.get.mock.calls[0][0]);
    expect(url).toContain('/rest/api/3/user/bulk');
    expect(url).toContain('accountId=a1');
    expect(url).toContain('accountId=a2');
  });

  it('dedupes duplicate ids and ignores falsy values', async () => {
    await buildService();
    httpService.get.mockReturnValueOnce(userResponse([
      { accountId: 'a1', displayName: 'Alice' },
    ]));

    await jiraService.getUsersByAccountIds(['a1', 'a1', '', null as any, undefined as any]);

    expect(httpService.get).toHaveBeenCalledTimes(1);
    const url = String(httpService.get.mock.calls[0][0]);
    // Only one accountId param despite the duplicates / falsy entries.
    expect(url.match(/accountId=/g)).toHaveLength(1);
  });

  it('returns an empty map without calling the API when there are no ids', async () => {
    await buildService();
    const users = await jiraService.getUsersByAccountIds([]);
    expect(users).toEqual({});
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('splits requests into chunks of 200 account ids', async () => {
    await buildService();
    httpService.get.mockReturnValue(userResponse([]));
    const ids = Array.from({ length: 201 }, (_, i) => `acc-${i}`);

    await jiraService.getUsersByAccountIds(ids);

    // 201 unique ids -> two chunks (200 + 1).
    expect(httpService.get).toHaveBeenCalledTimes(2);
  });

  it('degrades gracefully to an empty map when the API fails', async () => {
    await buildService();
    httpService.get.mockReturnValueOnce(throwError(() => new Error('boom')));

    const users = await jiraService.getUsersByAccountIds(['a1']);

    expect(users).toEqual({});
  });
});
