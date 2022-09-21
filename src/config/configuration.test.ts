import Config from './config.d';

export default (): Config => ({
  env: 'test',
  version: '1.2.0',
  web: {
    port: (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000,
    basePath: '/cpv',
    baseHost: process.env.CPV_BASEHOST || '',
    absoluteBasePath: `${process.env.CPV_BASEHOST}${process.env.CPV_BASEPATH}`,
  },
  confluence: {
    baseURL: 'https://test.atlassian.net',
    apiUsername: process.env.CPV_CONFLUENCE_API_USERNAME || '',
    apiToken: process.env.CPV_CONFLUENCE_API_TOKEN || '',
    apiTimeOut: process.env.CPV_CONFLUENCE_API_TIMEOUT,
    apiMaxRedirects: process.env.CPV_CONFLUENCE_API_MAX_REDIRECTS || '5',
  },
  konviw: {
    private: process.env.CPV_KONVIW_PRIVATE_PAGE,
  },
  matomo: {
    baseURL: process.env.CPV_MATOMO_BASE_URL || '',
    idSite: process.env.CPV_MATOMO_ID_SITE || '',
  },
  google: {
    tag: process.env.CPV_GOOGLE_ANALYTICS || '',
  },
  cache: {
    cacheTTL:
      (process.env.CACHE_TTL && parseInt(process.env.CACHE_TTL, 10)) || 86400,
    cacheMax:
      (process.env.CACHE_MAX && parseInt(process.env.CACHE_MAX, 10)) || 10,
  },
  logging: {
    enableLoggerMiddleware: process.env.ENABLE_LOGGER_MIDDLEWARE === 'true',
  },
});
