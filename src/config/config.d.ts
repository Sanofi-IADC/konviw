interface Config {
  env: string;

  version: string;

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

  cache: {
    cacheTTL: number;
    cacheMax: number;
  };
}

export default Config;
