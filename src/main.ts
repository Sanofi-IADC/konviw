import { NestFactory } from '@nestjs/core';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { join } from 'path';
import hbs from 'hbs';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppModule } from './app.module';

if (
  process.env.NODE_ENV !== 'local'
  && process.env.NODE_ENV !== 'test'
  && process.env.INSTANA_ENDPOINT_URL
) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  require('@instana/collector')();
}

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

  app.useGlobalFilters(new HttpExceptionFilter(config));

  // Default path for all routes
  app.setGlobalPrefix(`${basePath}`);

  // Define headers defaults
  app.disable('x-powered-by');
  app.enableCors();

  // Static assets folder
  app.useStaticAssets(join(__dirname, '..', '/static'), {
    prefix: `${basePath}`,
  });

  // Views folder for Handlebar templates
  app.setBaseViewsDir(join(__dirname, '..', '/views'));
  app.setViewEngine('hbs');
  hbs.registerPartials(join(__dirname, '..', '/views/partials'));

  // Set up Swagger
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

  // Listen to server PORT
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
