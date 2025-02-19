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

const FIND_JIRA_FIELD = jest.fn().mockImplementation(async () => ({
  data: [
    {
      "id": "summary",
      "key": "summary",
      "name": "summary",
      "schema": {
        "type": "string",
      }
    },
    {
      "id": "assignee",
      "key": "assignee",
      "name": "assignee",
      "schema": {
        "type": "user",
      }
    },
    {
      "id": "updated",
      "key": "updated",
      "name": "updated",
      "schema": {
        "type": "date",
      }
    },
    {
      "id": "status",
      "key": "status",
      "name": "status",
      "schema": {
        "type": "status",
      }
    },
    {
      "id": "lastViewed",
      "key": "lastViewed",
      "name": "last Viewed",
      "schema": {
        "type": "date",
      }
    }]
}));

export const jiraMockServiceFactory = {
  findProjectMetadata: FIND_PROJECT_METADATA,
  getFields: FIND_JIRA_FIELD,
} as unknown as JiraService;
