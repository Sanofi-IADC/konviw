import { Module } from '@nestjs/common';
import {
  HttpModuleOptions,
  HttpModule as BaseHttpModule,
} from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import httpsProxyAgent from 'https-proxy-agent';
import { XrayService } from './xray.service';

/**
 * Dedicated HTTP client for the Xray Cloud API.
 * It intentionally does NOT set the Confluence basic-auth defaults used by the
 * Atlassian HTTP module, since Xray GraphQL requests are authenticated with a
 * bearer token and basic-auth defaults would override the Authorization header.
 */
@Module({
  imports: [
    BaseHttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): HttpModuleOptions => ({
        timeout: Number(config.get('confluence.apiTimeOut')) || 0,
        maxRedirects: Number(config.get('confluence.apiMaxRedirects')) || 5,
        proxy: false,
        httpsAgent: config.get('httpsProxy')
          ? new (httpsProxyAgent as any)(config.get('httpsProxy'))
          : undefined,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [XrayService],
  exports: [XrayService],
})
export class XrayModule {}
