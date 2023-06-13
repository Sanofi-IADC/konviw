interface Config {
  env: string;

  version: string;

  httpsProxy?: string;

  web: {
    port: number;
    basePath: string;
    baseHost: string;
    absoluteBasePath: string;
  };

  confluence: {
    baseURL: string;
    apiUsername: string;
    apiToken: string;
    apiTimeOut: string;
    apiMaxRedirects: string;
  };

  konviw: {
    private: string;
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
