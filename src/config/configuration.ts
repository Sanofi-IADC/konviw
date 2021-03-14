import * as packageJson from '../../package.json';
import Config from '../config/config.d';

export default (): Config => ({
  env: process.env.NODE_ENV || 'production',
  version: 'version' in packageJson ? packageJson['version'] : 'beta',
  web: {
    port: (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000,
    basePath: process.env.CPV_BASEPATH || '/',
    baseHost: process.env.CPV_BASEHOST || '',
  },
  confluence: {
    baseURL: process.env.CPV_CONFLUENCE_BASE_URL || '',
    apiUsername: process.env.CPV_CONFLUENCE_API_USERNAME || '',
    apiToken: process.env.CPV_CONFLUENCE_API_TOKEN || '',
    apiTimeOut: process.env.CPV_CONFLUENCE_API_TIMEOUT,
    apiMaxRedirects: process.env.CPV_CONFLUENCE_API_MAX_REDIRECTS || '5',
  },
  matomo: {
    baseURL: process.env.CPV_MATOMO_BASE_URL || '',
    idSite: process.env.CPV_MATOMO_ID_SITE || '',
  },
});
