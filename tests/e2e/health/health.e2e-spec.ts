import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';

describe('HealthController (e2e)', () => {

  let app: INestApplication;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, {
      logger: false,
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Returns healthy status', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.statusCode).toBe(HttpStatus.OK);
  });
});
