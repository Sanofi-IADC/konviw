interface Config {
  env: string;

  version: string;

  httpsProxy?: string;

  web: {
    port: number;
    basePath: string;
    baseHost: string;
  };

  confluence: {
    baseURL: string;
    apiUsername: string;
    apiToken: string;
    apiTimeOut: string;
    apiMaxRedirects: string;
  };

  matomo: {
    baseURL: string;
    idSite: string;
  };

  google: {
    tag: string;
  };

  cache: {
    cacheTTL: number;
    cacheMax: number;
  };

  logging: {
    enableLoggerMiddleware: boolean;
  };
}

export default Config;
