import { JiraService } from '../../../src/jira/jira.service';

const FIND_PROJECT_METADATA = jest.fn().mockImplementation(async () => ({
  data: {
    name: 'Konviw',
    description: '',
    expand: {},
    avatarUrls: {
      '48x48': '',
    },
  },
}));

export const jiraMockServiceFactory = {
  findProjectMetadata: FIND_PROJECT_METADATA,
} as unknown as JiraService;
