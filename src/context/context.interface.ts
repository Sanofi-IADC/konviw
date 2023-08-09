export interface Version {
  versionNumber: number;
  when?: string;
  friendlyWhen?: string;
  modificationBy?: User;
}

export interface User {
  displayName: string;
  email: string;
  profilePicture: string;
}

export type ApiVersion = 'v1' | 'v2';
