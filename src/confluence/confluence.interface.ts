type ContentType = 'page' | 'blogpost' | 'comment' | 'attachment';
type RepresentationType =
  | 'view'
  | 'export_view'
  | 'styled_view'
  | 'storage'
  | 'editor2'
  | 'anonymous_export_view';
// type AuthType = 'cookie' | 'basic' | 'no';
type StatusType = 'current' | 'trashed' | 'historical' | 'draft';

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

interface BaseApiContentBody {
  title: string;
  type: ContentType;
  status?: StatusType;
  ancestors?: [] | [{ id: string }];
}

interface PostApiContentBody extends BaseApiContentBody {
  id?: string;
  space: { key: string };
  body: ContentBody;
}

interface PutApiContentBody extends BaseApiContentBody {
  version: { number: number };
  body?: ContentBody;
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

export interface SpaceSettings {
  routeOverrideEnabled: boolean;
  _links: GenericLinks;
}

export interface ThemeNoLinks {
  [key: string]: any;
  themeKey: string;
  name: string;
  description: string;
  icon: Icon;
}

export interface MenusLookAndFeel {
  hoverOrFocus: any;
  color: string;
}

export interface ButtonLookAndFeel {
  backgroundColor: string;
  color: string;
}

export interface NavigationLookAndFeel {
  color: string;
  hoverOrFocus: any;
}

export interface SearchFieldLookAndFeel {
  backgroundColor: string;
  color: string;
}

export interface HeaderLookAndFeel {
  backgroundColor: string;
  button: ButtonLookAndFeel;
  primaryNavigation: NavigationLookAndFeel;
  secondaryNavigation: NavigationLookAndFeel;
  search: SearchFieldLookAndFeel;
}

export interface ScreenLookAndFeel {
  background: string;
  backgroundColor: string;
  backgroundImage: string;
  backgroundSize: string;
  gutterTop: string;
  gutterRight: string;
  gutterBottom: string;
  gutterLeft: string;
}

export interface ContainerLookAndFeel {
  background: string;
  backgroundColor: string;
  backgroundImage: string;
  backgroundSize: string;
  padding: string;
  borderRadius: string;
}

export interface ContentLookAndFeel {
  screen: ScreenLookAndFeel;
  container: ContainerLookAndFeel;
  header: ContainerLookAndFeel;
  body: ContainerLookAndFeel;
}

export interface LookAndFeel {
  headings: any;
  links: any;
  menus: MenusLookAndFeel;
  header: HeaderLookAndFeel;
  content: ContentLookAndFeel;
  bordersAndDividers: any;
}

export interface Space {
  id: number; // int64
  key: string;
  name: string;
  type: string;
  status: string;
  _expandable: any;
  _links: GenericLinks;

  icon?: Icon;
  description?: any;
  homepage?: Content;
  metadata?: any;
  operations?: OperationCheckResult[];
  permissions?: SpacePermission;
  setting?: SpaceSettings;
  theme?: ThemeNoLinks;
  lookAndFeel?: LookAndFeel;
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

export interface Content {
  [key: string]: any;

  id: string;
  type: string;
  status: string;
  title: string;
  _expandable: any;
  _links: GenericLinks;

  space?: Space;
  history?: ContentHistory;
  version?: Version;
  body?: ContentBody;
  ancestors?: Content[];
  operations?: OperationCheckResult[];
  children?: ContentChildren;
  childrenTypes?: ContentChildType;
  descendants?: ContentChildren;
  container?: Container;
  restrictions?: any;
}
