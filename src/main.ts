import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import path from 'path';
import { AppModule } from './app.module';
import sassMiddleware from 'node-sass-middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  // as we need to access the Express API
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // logger: ['error', 'warn'];

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

  app.setGlobalPrefix('cpv');
  app.disable('x-powered-by');
  app.enableCors();
  app.use(
    sassMiddleware({
      src: path.resolve('./src/assets/scss'),
      dest: path.resolve('./static/css'),
      debug: true,
      outputStyle: 'compressed',
      log: function (severity: string, key: string, value: string) {
        logger.log(`${key} : ${value}`, `node-sass-middleware : ${severity}`);
      },
      prefix: '/css',
    }),
  );
  app.useStaticAssets(path.resolve('./static'));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
