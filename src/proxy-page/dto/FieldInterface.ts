export interface StatusCategory {
  self: string;
  id: number;
  key: string;
  colorName: string;
  name: string;
}

export interface StringContent {
  type: string;
  text: number;
}

export const isStringContent = (obj: any): obj is StringContent =>
  obj
  && typeof obj === 'object'
  && 'type' in obj
  && 'text' in obj;

export interface Status {
  self: string;
  description: string;
  iconUrl: string;
  name: string;
  id: string;
  statusCategory?: StatusCategory;
}

export const isStatusCategory = (obj: any): obj is StatusCategory =>
  obj
  && typeof obj === 'object'
  && 'self' in obj
  && 'id' in obj
  && 'key' in obj
  && 'colorName' in obj
  && 'name' in obj;

export const isStatus = (obj: any): obj is Status =>
  obj
  && typeof obj === 'object'
  && 'self' in obj
  && 'description' in obj
  && 'iconUrl' in obj
  && 'name' in obj
  && 'id' in obj;

export interface Issue {
  id: string;
  key: string;
  self: string;
  updated: string;
  fields?: Record<string, any>;
}

export const isIssue = (obj: any): obj is Issue =>
  obj
  && typeof obj === 'object'
  && 'id' in obj
  && 'key' in obj
  && 'self' in obj;
export interface Option {
  self: string;
  value: string;
  id: string;
}

export const isOption = (obj: any): obj is Option =>
  obj
  && typeof obj === 'object'
  && 'self' in obj
  && 'value' in obj
  && 'id' in obj;

export interface Votes {
  self: string;
  votes: number;
  hasVoted: boolean;
}

export const isVotes = (obj: any): obj is Votes =>
  obj
  && typeof obj === 'object'
  && 'self' in obj
  && 'votes' in obj
  && 'hasVoted' in obj;

export interface User {
  self: string;
  accountId: string;
  emailAddress: string;
  displayName: string;
}

export const isUser = (obj: any): obj is User =>
  obj
  && typeof obj === 'object'
  && 'self' in obj
  && 'accountId' in obj
  && 'emailAddress' in obj
  && 'displayName' in obj;

export interface Resolution {
  self: string;
  id: string;
  description: string;
  name: string;
}

export const isResolution = (obj: any): obj is Resolution =>
  obj
  && typeof obj === 'object'
  && 'self' in obj
  && 'id' in obj
  && 'description' in obj
  && 'name' in obj;

export interface Priority {
  self: string;
  iconUrl: string;
  name: string;
  id: string;
}

export const isPriority = (obj: any): obj is Priority =>
  obj
  && typeof obj === 'object'
  && 'self' in obj
  && 'iconUrl' in obj
  && 'name' in obj
  && 'id' in obj;

export interface IssueType {
  self: string;
  id: string;
  description: string;
  iconUrl: string;
  name: string;
}

export const isIssueType = (obj: any): obj is IssueType =>
  obj
  && typeof obj === 'object'
  && 'self' in obj
  && 'id' in obj
  && 'description' in obj
  && 'iconUrl' in obj
  && 'name' in obj;

export interface Version {
  self: string;
  id: string;
  description: string;
  name: string;
  archived: boolean;
  released: boolean;
}

export const isVersion = (obj: any): obj is Version =>
  obj
  && typeof obj === 'object'
  && 'self' in obj
  && 'id' in obj
  && 'description' in obj
  && 'name' in obj
  && 'archived' in obj
  && 'released' in obj;

export interface Component {
  self: string;
  id: string;
  name: string;
}

export const isComponent = (obj: any): obj is Component =>
  obj
  && typeof obj === 'object'
  && 'self' in obj
  && 'id' in obj
  && 'name' in obj;

export interface Json {
  id: string;
  name: string;
  state: string;
}

export const isJson = (obj: any): obj is Json =>
  obj
  && typeof obj === 'object'
  && 'id' in obj
  && 'name' in obj
  && 'state' in obj;

export interface Team {
  id: string;
  name: string;
  title: string;
}

export const isTeam = (obj: any): obj is Team =>
  obj
  && typeof obj === 'object'
  && 'id' in obj
  && 'name' in obj
  && 'title' in obj;

interface Predicate<T> {
  (obj: any): obj is T;
}

const extractValuesFromItem = <T>(
  item: any,
  values: any[],
  predicate: Predicate<T>,
  fieldName: keyof T,
): void => {
  if (predicate(item)) {
    const value = (item as T)[fieldName];
    values.push(value != null ? value : '');
  } else if (typeof item === 'object' && item !== null) {
    Object.keys(item).forEach((prop) => {
      extractValuesFromItem(item[prop], values, predicate, fieldName);
    });
  }
};

const getAllValues = <T>(
  data: any,
  predicate: Predicate<T>,
  fieldName: keyof T,
): any[] => {
  const values: any[] = [];
  if (Array.isArray(data)) {
    data.forEach((item) =>
      extractValuesFromItem(item, values, predicate, fieldName));
  } else {
    extractValuesFromItem(data, values, predicate, fieldName);
  }
  return values;
};

export const formatTeam = (value: any) => {
  const nameTeam = getAllValues(value, isTeam, 'name');
  return [nameTeam, 'normal'] as [string[], string];
};

export const formatVersion = (value: any) => {
  const versionName = getAllValues(value, isVersion, 'name');
  const versionUrl = getAllValues(value, isVersion, 'description');
  const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  const result = versionUrl.flatMap((description) => {
    const validDescription = description || '';
    return validDescription.match(urlRegex);
  });
  const fixVersionsArray = versionName.map((name, index) => {
    const link = result[index] || '';
    return {
      name: [name],
      link: [link],
    };
  });

  return [fixVersionsArray, 'link'] as [{ name: string[]; link: string[] }[], string];
};

export const formatIssueLinks = (value: any, baseUrl: string) => {
  const issuesValues = getAllValues(value, isIssue, 'key');
  return [issuesValues.map((issueValue) => createLinkObject(issueValue, baseUrl)), 'link'] as [{ name: string; link: string }[], string];
};

export const formatJson = (value: any) => {
  const nameJson = getAllValues(value, isJson, 'name');
  return [nameJson, 'normal'] as [string[], string];
};

export const formatComponent = (value: any) => {
  const nameComponent = getAllValues(value, isComponent, 'name');
  return [nameComponent, 'normal'] as [string[], string];
};

export const formatStatus = (value: any) => {
  const statusName = getAllValues(value, isStatus, 'name');
  const statusColor = getAllValues(value, isStatusCategory, 'colorName');
  const statusArray = statusName.map((name, index) => ({
    name: [name],
    color: [statusColor[index]],
  }));
  return [statusArray, 'status'] as [{ name: string[]; color: string[] }[], string];
};

export const formatOption = (value: any) => {
  const idOption = getAllValues(value, isOption, 'value');
  return [idOption, 'normal'] as [string[], string];
};

export const formatUser = (value: any) => {
  const nameUser = getAllValues(value, isUser, 'displayName');
  return [nameUser, 'normal'] as [string[], string];
};

export const formatResolution = (value: any) => {
  const nameResolution = getAllValues(value, isResolution, 'name');
  return [nameResolution, 'normal'] as [string[], string];
};

export const formatPriority = (value: any) => {
  const namePriority = getAllValues(value, isPriority, 'name');
  const iconPriority = getAllValues(value, isPriority, 'iconUrl');
  const priorityArray = namePriority.map((name, index) => ({
    name: [name],
    icon: [iconPriority[index]],
  }));
  return [priorityArray, 'icon'] as [{ name: string[]; icon: string[] }[], string];
};

export const formatIssueType = (value: any) => {
  const issueTypeNames = getAllValues(value, isIssueType, 'name');
  const issueTypeIcons = getAllValues(value, isIssueType, 'iconUrl');
  const issueTypeArray = issueTypeNames.map((name, index) => ({
    name: [name],
    icon: [issueTypeIcons[index]],
  }));
  return [issueTypeArray || [], 'icon'];
};

export const formatDateTime = (dateString) => {
  const formatted = dateString
    ? `${new Date(dateString).toLocaleString('en-EN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })}`
    : '';
  return [[formatted], 'date'];
};

export const formatDate = (dateString) => {
  const formatted = dateString
    ? `${new Date(dateString).toLocaleString('en-EN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })}`
    : '';
  return [[formatted], 'date'];
};

export const formatVotes = (value: any) => {
  const votes = getAllValues(value, isVotes, 'votes');
  return [votes, 'normal'];
};

export const formatNumber = (number) => [[number || ''], 'normal'];

export const formatString = (string) => {
  if (string?.content) {
    const flatMapResult = string.content.flatMap((item) => item.content);
    const mappedResults = flatMapResult.filter(Boolean).map((subItem) => {
      if (subItem?.type === 'inlineCard') {
        return subItem.attrs.url;
      }
      return getAllValues(subItem, isStringContent, 'text');
    });
    const combinedString = mappedResults.flat().join(' ');
    return [[combinedString ?? ''], 'normal'];
  } if (string) {
    return [[string], 'normal'];
  }
  return [[''], 'normal'];
};

export const createLinkObject = (key, baseUrl, name = '') => ({
  name: name || key || '',
  link: key ? `${baseUrl}/browse/${key}?src=confmacro` : '',
});

export const fieldFunctions: {
  [key: string]: (value: any, baseUrl?: string) => any;
} = {
  date: formatDate,
  datetime: formatDateTime,
  number: formatNumber,
  option: formatOption,
  user: formatUser,
  priority: formatPriority,
  string: formatString,
  resolution: formatResolution,
  version: formatVersion,
  votes: formatVotes,
  component: formatComponent,
  team: formatTeam,
  status: formatStatus,
  issuetype: formatIssueType,
  issuelinks: (value: any, baseUrl?: string) =>
    formatIssueLinks(value, baseUrl),
  json: formatJson,
};
