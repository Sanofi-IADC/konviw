import { Content } from '../confluence/confluence.interface';
import { ApiVersion } from './context.interface';

/*
 * Get the amount of time from now for a date
 * (c) 2019 Chris Ferdinandi, MIT License
 * https://gomakethings.com/a-vanilla-js-alternative-to-the-moment.js-timefromnow-method/
 * @param  {String} The date to get the time from now for
 * @return {String} The time from now data
 */
export const timeFromNow = (TimeToConvert: string): string => {
  // Get timestamps
  const unixTime = new Date(TimeToConvert).getTime();
  if (!unixTime) return '';
  const now = new Date().getTime();
  // Calculate difference
  let difference = unixTime / 1000 - now / 1000;
  // Convert difference to absolute
  difference = Math.abs(difference);
  let unitOfTime = '';
  let time = 0;
  // Calculate time unit
  if (difference / (60 * 60 * 24 * 365) > 1) {
    unitOfTime = 'years';
    time = Math.floor(difference / (60 * 60 * 24 * 365));
  } else if (difference / (60 * 60 * 24 * 45) > 1) {
    unitOfTime = 'months';
    time = Math.floor(difference / (60 * 60 * 24 * 45));
  } else if (difference / (60 * 60 * 24) > 1) {
    unitOfTime = 'days';
    time = Math.floor(difference / (60 * 60 * 24));
  } else if (difference / (60 * 60) > 1) {
    unitOfTime = 'hours';
    time = Math.floor(difference / (60 * 60));
  } else {
    unitOfTime = 'seconds';
    time = Math.floor(difference);
  }
  // Return time from now data
  return `${time} ${unitOfTime} ago`;
};

export const setTitleHelper = (data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => data.title,
    v2: () => data.pageContent.title,
  };
  return config[apiVersion]();
};

export const setSpaceKeyHelper = (data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => {
      const [,,,, key] = data._expandable.space.split('/');
      return key;
    },
    v2: () => data.spaceContent.key,
  };
  return config[apiVersion]();
};

export const setHtmlBodyHelper = (data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => data.body.view.value,
    v2: () => data.pageContent.body.view.value,
  };
  return config[apiVersion]();
};

export const setBodyStorageHelper = (data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => data.body?.storage?.value,
    v2: () => data.pageContent?.body?.storage?.value,
  };
  return config[apiVersion]();
};

export const setAuthorHelper = (data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => data.history.createdBy?.displayName,
    v2: () => data.authorContent.publicName,
  };
  return config[apiVersion]();
};

export const setEmailHelper = (data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => data.history.createdBy?.email,
    v2: () => data.authorContent.email,
  };
  return config[apiVersion]();
};

export const setAvatarHelper = (baseHost: string, basePath: string, data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => `${baseHost}${basePath}/${data.history.createdBy?.profilePicture.path.replace(
      /^\/wiki/,
      'wiki',
    )}`,
    v2: () => `${baseHost}${basePath}/${data.authorContent.profilePicture.path.replace(
      /^\/wiki/,
      'wiki',
    )}`,
  };
  return config[apiVersion]();
};

export const setWhenHelper = (data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => data.history.createdDate,
    v2: () => data.pageContent.createdAt,
  };
  return config[apiVersion]();
};

export const setLabelsHelper = (data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => data.metadata.labels.results,
    v2: () => data.labelsContent.results,
  };
  return config[apiVersion]();
};

export const setCreatedVersionHelper = (data: Content, apiVersion: ApiVersion, getAvatar: () => string) => {
  const config = {
    v1: () => ({
      when: data.history.createdDate,
      friendlyWhen: timeFromNow(data.history.createdDate),
      modificationBy: {
        displayName: data.history.createdBy?.displayName,
        email: data.history.createdBy?.email,
        profilePicture: getAvatar(),
      },
    }),
    v2: () => ({
      when: data.pageContent.createdAt,
      friendlyWhen: timeFromNow(data.pageContent.createdAt),
      modificationBy: {
        displayName: data.authorContent.publicName,
        email: data.authorContent.email,
        profilePicture: getAvatar(),
      },
    }),
  };
  return {
    versionNumber: 1,
    ...config[apiVersion](),
  };
};

export const setLastVersionHelper = (baseHost: string, basePath: string, data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => ({
      versionNumber: data.version.number,
      when: data.version.when,
      friendlyWhen: timeFromNow(data.version.when),
      modificationBy: {
        displayName: data.version.by.publicName,
        email: data.version.by.email,
        profilePicture: `${baseHost}${basePath}/${data.version.by.profilePicture?.path.replace(
          /^\/wiki/,
          'wiki',
        )}`,
      },
    }),
    v2: () => ({
      versionNumber: data.pageContent.version.number,
      when: data.pageContent.version.createdAt,
      friendlyWhen: timeFromNow(data.pageContent.version.createdAt),
      modificationBy: {
        displayName: data.versionAuthorContent.publicName,
        email: data.versionAuthorContent.email,
        profilePicture: `${baseHost}${basePath}/${data.versionAuthorContent.profilePicture?.path.replace(
          /^\/wiki/,
          'wiki',
        )}`,
      },
    }),
  };
  return config[apiVersion]();
};

export const contentAppearancePublishedHelper = (data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => data.metadata?.properties['content-appearance-published']?.value,
    v2: () => data.propertiesContent['content-appearance-published']?.value,
  };
  return config[apiVersion]();
};

export const coverPictureIdPublishedHelper = (data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => data.metadata?.properties['cover-picture-id-published']?.value,
    v2: () => data.propertiesContent['cover-picture-id-published']?.value,
  };
  return config[apiVersion]();
};

export const emojiTitlePublishedHelper = (data: Content, apiVersion: ApiVersion) => {
  const config = {
    v1: () => data.metadata?.properties['emoji-title-published']?.value,
    v2: () => data.propertiesContent['emoji-title-published']?.value,
  };
  return config[apiVersion]();
};
