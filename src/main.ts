import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import path, { join } from 'path';
import { AppModule } from './app.module';
import sassMiddleware from 'node-sass-middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import Config from './config/config';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  // as we need to access the Express API
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // logger: ['error', 'warn'];
  const basePath = app.get(ConfigService).get<Config>('web.basePath');
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
  app.use(
    sassMiddleware({
      src: path.resolve('./src/assets/scss'),
      dest: join(__dirname, '..', 'static'),
      debug: true,
      outputStyle: 'compressed',
      log: function (severity: string, key: string, value: string) {
        logger.log(`${key} : ${value}`, `node-sass-middleware : ${severity}`);
      },
      prefix: '/css',
    }),
  );
  app.useStaticAssets(join(__dirname, '..', 'static'), {
    prefix: `${basePath}`,
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
