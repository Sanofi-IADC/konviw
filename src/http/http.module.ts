import { Logger, Module, OnModuleInit } from '@nestjs/common';
import {
  HttpService,
  HttpModuleOptions,
  HttpModule as BaseHttpModule,
} from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import httpsProxyAgent from 'https-proxy-agent';

@Module({
  imports: [
    BaseHttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): HttpModuleOptions => ({
        baseURL: `${config.get('confluence.baseURL')}`,
        auth: {
          username: config.get('confluence.apiUsername').toString(),
          password: config.get('confluence.apiToken').toString(),
        },
        timeout: Number(config.get('confluence.apiTimeOut')),
        maxRedirects: Number(config.get('confluence.apiMaxRedirects')),
        proxy: process.env.https_proxy
        ? new (httpsProxyAgent as any)(process.env.https_proxy)
        : undefined,
        httpsAgent: process.env.https_proxy
          ? new (httpsProxyAgent as any)(process.env.https_proxy)
          : undefined,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [BaseHttpModule],
})
export class HttpModule implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  public onModuleInit(): any {
    const logger = new Logger('Axios');

    console.log(process.env.HTTPS_PROXY);

    // Add request interceptor and response interceptor to log request infos
    const axios = this.httpService.axiosRef;
    axios.interceptors.request.use(function (config) {
      config['metadata'] = { ...config['metadata'], startDate: new Date() };
      return config;
    });
    axios.interceptors.response.use(
      (response) => {
        const { config } = response;
        config['metadata'] = { ...config['metadata'], endDate: new Date() };
        const duration =
          config['metadata'].endDate.getTime() -
          config['metadata'].startDate.getTime();

        // Log some request infos (you can actually extract a lot more if you want: the content type, the content size, etc.)
        logger.log(
          `${config.method.toUpperCase()} ${config.url} ${duration}ms`,
        );

        return response;
      },
      (err) => {
        logger.error(err);

        // Don't forget this line like I did at first: it makes your failed HTTP requests resolve with "undefined" :-(
        return Promise.reject(err);
      },
    );
  }
}
