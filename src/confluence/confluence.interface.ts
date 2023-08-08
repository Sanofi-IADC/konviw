type ContentType = 'page' | 'blogpost' | 'comment' | 'attachment';
type SpaceType = 'global' | 'personal';
type RepresentationType =
  | 'view'
  | 'export_view'
  | 'styled_view'
  | 'storage'
  | 'editor2'
  | 'anonymous_export_view';
type ContentStatusType = 'current' | 'trashed' | 'historical' | 'draft';
type SpaceStatusType = 'current' | 'archived';

interface ContentBodyCreate {
  value: string;
  representation: RepresentationType;
}

interface ContentBody {
  view?: ContentBodyCreate;
  export_view?: ContentBodyCreate;
  styled_view?: ContentBodyCreate;
  storage?: ContentBodyCreate;
  editor2?: ContentBodyCreate;
  anonymous_export_view?: ContentBodyCreate;
}

export interface OperationCheckResult {
  operation: string;
  targetType: string;
}

export interface ContentChildType {
  _expandable: any;
  attachment?: any;
  comment?: any;
  page?: any;
}

export interface GenericLinks {
  [key: string]: string;
}

export interface ContentArray {
  results: Content[];
  start: number; // int32
  limit: number; // int32
  size: number; // int32
  _links: GenericLinks;
}

export interface ContentChildren {
  attachment?: ContentArray;
  comment?: ContentArray;
  page?: ContentArray;
  _expandable: any;
  _links: GenericLinks;
}

export interface Container {
  [key: string]: string;
}

export interface Icon {
  path: string;
  width: number; // int32
  height: number; // int32
  isDefault: boolean;
}

export interface SpacePermission {
  subject: any;
  operation: OperationCheckResult;
  anonymousAccess: boolean;
  unlicensedAccess: boolean;
}

export interface Space {
  id: number; // int64
  key: string;
  name: string;
  type: SpaceType;
  status: SpaceStatusType;
  _expandable: any;
  _links: GenericLinks;

  icon?: Icon;
  description?: any;
  homepage?: Content;
  metadata?: any;
  operations?: OperationCheckResult[];
  permissions?: SpacePermission;
  setting?: any;
  theme?: any;
  lookAndFeel?: any;
  history?: any;
}

export interface UserDetails {
  business?: any;
  personal?: any;
}

export interface User {
  type: 'known' | 'unknown' | 'anonymous' | 'user';
  accountId: string; // 384093:32b4d9w0-f6a5-3535-11a3-9c8c88d10192
  accountType: 'atlassian' | 'app' | '';
  email: string;
  publicName: string;
  profilePicture: Icon;
  displayName: string;
  _expandable: any;
  _links: GenericLinks;

  username?: string;
  userKey?: string;
  operations?: OperationCheckResult[];
  details?: UserDetails;
  personalSpace?: Space;
}

export interface UsersUserKeys {
  users: User[];
  userKeys: string[];
  _links?: GenericLinks;
}

export interface Version {
  by: User;
  when: string; // date-time
  friendlyWhen: string;
  message: string;
  number: number; // int32
  minorEdit: boolean;
  _expandable: any;
  _links: GenericLinks;

  content?: Content;
  collaborators?: UsersUserKeys;
}

export interface ContentHistory {
  latest: boolean;
  createdBy: User;
  createdDate: string; // date-time
  lastUpdated?: Version;
  previousVersion?: Version;
  contributors?: any;
  nextVersion?: Version;
  _expandable?: any;
  _links?: GenericLinks;
}

export interface Content extends ContentRestAPIv2 {
  [key: string]: any;

  id: string;
  type: ContentType;
  status: ContentStatusType;
  title: string;
  _expandable: any;
  _links: GenericLinks;

  space?: Space;
  history?: ContentHistory;
  version?: Version;
  body?: ContentBody;
  metadata?: ContentMetadata;
  ancestors?: Content[];
  operations?: OperationCheckResult[];
  children?: ContentChildren;
  childrenTypes?: ContentChildType;
  descendants?: ContentChildren;
  container?: Container;
  restrictions?: any;
}

export interface ContentMetadata {
  labels?: LabelsArray;
  properties?: any;
}

export interface LabelsArray {
  results: Label[];
  start: number; // int32
  limit: number; // int32
  size: number; // int32
  _links: GenericLinks;
}

export interface Label {
  prefix: string;
  name: string;
  id: string;
  label: string;
}

export interface SearchResults {
  results: ResultsContent[];
  start: number;
  limit: number;
  size: number;
  totalSize: number;
  cqlQuery: string;
  searchDuration: number;
  _links: GenericLinks;
}

export interface ResultsContent {
  content: Content;
  title: string;
  excerpt: string;
  url: string;
  resultGlobalContainer: ResultGlobalContainer;
  breadcrumbs: any[];
  entityType: string;
  iconCssClass: string;
  lastModified: string;
  friendlyLastModified: string;
  score: number;
}

export interface ResultGlobalContainer {
  title: string;
  displayUrl: string;
}

export interface Attachment {
  id: string,
  comment: string,
  version: {
    number: number,
    message: string,
    minorEdit: boolean,
    authorId: string,
    createdAt: string // date-time
},
  downloadLink: string,
  mediaType: string,
  title: string,
  fileSize: number,
  status: ContentStatusType,
  pageId: number,
  fileId: string,
  mediaTypeDescription: string,
  webuiLink: string,
  _links: GenericLinks
}

export type Properties = {
  [key: string]: {
    value: string;
    key: string;
    id: string;
    version: any;
  }
}

export type PageContent = {
  id: string;
  version: {
    number: number;
    message: string;
    minorEdit: boolean;
    authorId: string;
    createdAt: string;
  },
  parentType: string;
  authorId: string;
  title: string;
  status: ContentStatusType;
  body: { view: { value: string }, storage: { value: string } },
  parentId: string;
  spaceId: string;
  createdAt: string;
  position: number;
  _links: GenericLinks;
};

export type SpaceContent = {
  name: string;
  key: string;
  id: string;
  type: string;
  homepageId: string;
  icon: string | null;
  description: string | null;
  status: string;
  createdAt: string;
};

export type LabelsContent = LabelsArray;

export type PropertiesContent = Properties;

export type AuthorContent = {
  type: string;
  accountId: string;
  accountType: string;
  email: string;
  publicName: string;
  profilePicture: Icon,
  displayName: string;
  isExternalCollaborator: boolean,
  _expandable: GenericLinks;
  _links: GenericLinks;
};

export type VersionAuthorContent = {
  type: string;
  accountId: string;
  accountType: string;
  email: string;
  publicName: string;
  profilePicture: Icon,
  displayName: string;
  isExternalCollaborator: boolean;
  _expandable: GenericLinks;
  _links: GenericLinks;
};

export type ContentRestAPIv2 = {
  [key: string]: any;
  pageContent: PageContent;
  spaceContent: SpaceContent;
  labelsContent: LabelsContent;
  propertiesContent: PropertiesContent;
  authorContent: AuthorContent;
  versionAuthorContent: VersionAuthorContent;
};
