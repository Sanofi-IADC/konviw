import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';

jest.setTimeout(30000);

describe('HealthController (e2e)', () => {

  let app: INestApplication;

  afterEach(() => {
    jest.useRealTimers();
  });

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
    jest.useFakeTimers('legacy');
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.statusCode).toBe(HttpStatus.OK);
  });
});
