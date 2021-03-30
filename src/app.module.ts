import {
  Module,
  NestModule,
  MiddlewareConsumer,
  CacheModule,
  CacheInterceptor,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from './http/http.module';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { ContextService } from './context/context.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ConfluenceModule } from './confluence/confluence.module';
import { ProxyPageModule } from './proxy-page/proxy-page.module';
import { ProxyApiModule } from './proxy-api/proxy-api.module';
import configuration from './config/configuration';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    ConfluenceModule,
    ProxyPageModule,
    ProxyApiModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    CacheModule.register({
      ttl: 604800, // 1 week
      max: 10,
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    ContextService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // TODO: Improve the logger customization in development mode (* for all routes)
    consumer.apply(LoggerMiddleware).forRoutes('/slides*');
  }
}
