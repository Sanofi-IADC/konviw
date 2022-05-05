export interface Version {
  versionNumber: number;
  lastModification: Date;
  modificationBy: string;
}

export interface Update {
  displayName: string;
  email: string;
  profilePicture: string;
  version?: number;
  when: string;
  friendlyWhen: string;
}