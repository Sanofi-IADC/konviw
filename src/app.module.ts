import {
  Module,
  NestModule,
  MiddlewareConsumer,
  CacheModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { HealthController } from './health/health.controller';
import { ApiHealthService } from './health/health-atlassian.service';
import { ContextService } from './context/context.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ConfluenceModule } from './confluence/confluence.module';
import { ProxyPageModule } from './proxy-page/proxy-page.module';
import { ProxyApiModule } from './proxy-api/proxy-api.module';
import { GoogleAnalyticsModule } from './google-analytics/google-analytics.module';
import configuration from './config/configuration';
import CustomHttpCacheInterceptor from './cache/custom-http-cache.interceptor';

@Module({
  imports: [
    TerminusModule,
    ConfluenceModule,
    GoogleAnalyticsModule,
    ProxyPageModule,
    ProxyApiModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get('cache.cacheTTL'),
        max: configService.get('cache.cacheMax'),
        isGlobal: true,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [HealthController, AppController],
  providers: [
    ApiHealthService,
    ContextService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomHttpCacheInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private config: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    if (this.config.get('logging.enableLoggerMiddleware')) {
      consumer.apply(LoggerMiddleware).forRoutes('*');
    }
  }
}
