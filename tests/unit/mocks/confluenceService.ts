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
const GET_ATTACHMENTS = jest.fn().mockImplementation(() => ([{
  webuiLink: '/pages/viewpageattachments.action?pageId=246153217&preview=%2F246153217%2F246251521%2Ftest.pdf',
  mediaTypeDescription: 'PDF Document',
  id: 'att246251521',
  comment: '',
  version: {
    number: 1,
    message: '',
    minorEdit: true,
    authorId: '6349463d2edf195c40ab7ff4',
    createdAt: '2023-08-21T07:41:43.844Z'
  },
  title: 'test.pdf',
  fileSize: 9030,
  status: 'current',
  pageId: '246153217',
  fileId: '6bb98cf1-790f-4f2c-9fe4-ca196a4ca7ef',
  mediaType: 'application/pdf',
  createdAt: null,
  _links: {
    download: '/download/attachments/246153217/test.pdf?version=1&modificationDate=1692603703844&cacheVersion=1&api=v2',
    webui: '/pages/viewpageattachments.action?pageId=246153217&preview=%2F246153217%2F246251521%2Ftest.pdf'
  }
}]));

const GET_ATTACHMENT_BASE64 = jest.fn().mockImplementation(() => 'testBase64');

export const confluenceMockServiceFactory = {
  getSpaceMetadata: GET_SPACE_METADATA,
  getSpecialAtlassianIcons: GET_SPECIAL_ATLASSIAN_ICONS,
  getAttachments : GET_ATTACHMENTS,
  getAttachmentBase64: GET_ATTACHMENT_BASE64,
} as unknown as ConfluenceService;
