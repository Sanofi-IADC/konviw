import { ConfluenceService } from '../../../src/confluence/confluence.service';

const GET_SPACE_METADATA = jest.fn().mockImplementation(() => ({
  data: {
    id: 63859916804,
    key: 'konviw',
    name: 'konviw',
    icon: {
      path: '/download/attachments/63859916803/konviw?version=1&modificationDate=1664237784553&cacheVersion=1&api=v2',
      width: 48,
      height: 48,
      isDefault: false,
    },
    homepage: {
      id: '63862669800',
      type: 'page',
      status: 'current',
      title: 'konviw an enterprise public viewer for your Confluence pages',
    },
  },
}));

const GET_SPECIAL_ATLASSIAN_ICONS = jest.fn().mockImplementation((image: string) =>
  image ? {} : [],
);

export const confluenceMockServiceFactory = {
  getSpaceMetadata: GET_SPACE_METADATA,
  getSpecialAtlassianIcons: GET_SPECIAL_ATLASSIAN_ICONS
} as unknown as ConfluenceService;
