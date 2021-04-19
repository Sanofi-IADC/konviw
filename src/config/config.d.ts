import { LogLevel } from '@nestjs/common';

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

  cache: {
    cacheTTL: number;
    cacheMax: number;
  };

  appearance: {
    showFloatingToc: boolean;
  };

  logging: {
    enableLoggerMiddleware: boolean;
    level: LogLevel;
  };
}

export default Config;
