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
    emojiCollection: string;
  };

  konviw: {
    private: string;
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

  jiraIssues: {
    apiReaderUsername: string;
    apiReaderToken: string;
  }
}

export default Config;
