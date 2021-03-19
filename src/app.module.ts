import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
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
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, ContextService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // TODO: Improve the logger customization in development mode (* for all routes)
    consumer.apply(LoggerMiddleware).forRoutes('/slides*');
  }
}
