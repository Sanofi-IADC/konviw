import { NestFactory } from '@nestjs/core';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';

/**
 * Entry point of application. By using the NestFactory.create() method a new Nest application instance is created.
 * @return {string} 'html' - full html of the rendered Confluence page
 * @param spaceKey {string} 'iadc' - space key where the page belongs
 */
async function bootstrap() {
  let logLevel: Array<LogLevel>;
  if (process.env.NODE_ENV === 'development') {
    logLevel = ['log', 'warn', 'error'];
  } else {
    logLevel = ['warn', 'error'];
  }
  // as we need to access the Express API
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logLevel,
  });
  const config = app.get(ConfigService);
  const basePath = config.get('web.basePath');
  app.useGlobalPipes(
    // Reference: https://docs.nestjs.com/techniques/validation#auto-validation
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      disableErrorMessages: true,
      validationError: {
        value: true,
      },
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix(`${basePath}`);
  app.disable('x-powered-by');
  app.enableCors();

  app.useStaticAssets(join(__dirname, '..', '/static'), {
    prefix: `${basePath}`,
  });

  const configSwagger = new DocumentBuilder()
    .setTitle('konviw')
    .setDescription('Enterprise public viewer for your Confluence pages')
    .setVersion(config.get('version'))
    .build();

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'konviw OpenAPI Docs',
    customfavIcon: `${basePath}/favicon/favicon.ico`,
    customCssUrl: `${basePath}/css/swagger-theme-outline.css`,
  };

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup(`${basePath}/oas3`, app, document, customOptions);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
