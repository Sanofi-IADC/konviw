import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { AppModule } from './app.module';
import * as sassMiddleware from 'node-sass-middleware';

async function bootstrap() {
  // const logger = new Logger('bootstrap');
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

  app.setGlobalPrefix('cpv');
  app.enableCors();
  app.use(
    sassMiddleware({
      src: path.resolve('./src/assets/scss'),
      dest: path.resolve('./static/css'),
      debug: false,
      outputStyle: 'compressed',
      // log: function (severity: string, key: string, value: string) {
      //   logger.log(`${key} : ${value}`, `node-sass-middleware : ${severity}`);
      // },
      prefix: '/css',
    }),
  );
  app.useStaticAssets(path.resolve('./static'));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
