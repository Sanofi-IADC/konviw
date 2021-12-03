import packageJson from '../../package.json';
import Config from '../config/config.d';

export default (): Config => ({
  env: process.env.NODE_ENV || 'production',
  version: 'version' in packageJson ? packageJson['version'] : 'beta',
  httpsProxy: process.env.HTTPS_PROXY,
  web: {
    port: (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000,
    basePath: process.env.CPV_BASEPATH,
    baseHost: process.env.CPV_BASEHOST,
  },
  confluence: {
    baseURL: process.env.CPV_CONFLUENCE_BASE_URL,
    apiUsername: process.env.CPV_CONFLUENCE_API_USERNAME,
    apiToken: process.env.CPV_CONFLUENCE_API_TOKEN,
    apiTimeOut: process.env.CPV_CONFLUENCE_API_TIMEOUT,
    apiMaxRedirects: process.env.CPV_CONFLUENCE_API_MAX_REDIRECTS || '5',
  },
  konviw: {
    private: process.env.CPV_KONVIW_PRIVATE_PAGE,
  },
  matomo: {
    baseURL: process.env.CPV_MATOMO_BASE_URL,
    idSite: process.env.CPV_MATOMO_ID_SITE,
  },
  google: {
    tag: process.env.CPV_GOOGLE_ANALYTICS,
  },
  cache: {
    cacheTTL:
      (process.env.CACHE_TTL && parseInt(process.env.CACHE_TTL, 10)) || 60,
    cacheMax:
      (process.env.CACHE_MAX && parseInt(process.env.CACHE_MAX, 10)) || 100,
  },
  logging: {
    enableLoggerMiddleware: process.env.ENABLE_LOGGER_MIDDLEWARE === 'true',
  },
});
