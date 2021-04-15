import {
  HttpService,
  Logger,
  Module,
  HttpModuleOptions,
  OnModuleInit,
  HttpModule as BaseHttpModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Config from '../config/config';
import { JiraService } from './jira.service';

@Module({
  imports: [
    BaseHttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): HttpModuleOptions => ({
        baseURL: `${config.get<Config>('confluence.baseURL')}/wiki`,
        auth: {
          username: config.get<Config>('confluence.apiUsername').toString(),
          password: config.get<Config>('confluence.apiToken').toString(),
        },
        timeout: Number(config.get<Config>('confluence.apiTimeOut')),
        maxRedirects: Number(config.get<Config>('confluence.apiMaxRedirects')),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JiraService],
  exports: [BaseHttpModule, JiraService],
})
export class HttpModule implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  public onModuleInit(): any {
    const logger = new Logger('Axios');

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
