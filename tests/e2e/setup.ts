import { Test } from '@nestjs/testing';
// It is used below
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      app: INestApplication;
    }
  }
}
export default global;

beforeAll(async () => {
  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    global.app = moduleRef.createNestApplication();
    await global.app.init();
  } catch (e) {
    console.error('Could not start NestJS server for e2e tests', e);
    setTimeout(() => process.exit(1), 1000); // let display the error message
  }
}, 60 * 60 * 1000); // disable timeout so it doesn't start tests if NestJS doesn't start

afterAll(async () => {
  if (global.app) {
    await Promise.all([global.app.close()]);
  }
});
