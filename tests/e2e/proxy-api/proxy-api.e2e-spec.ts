import request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('proxy-api', () => {
  let app: INestApplication;

  // page IDs from official Konviw Confluence for e2e tests
  // use this testing method sparingly as changes to the content can break tests
  const INTRO_TO_KONVIW_ID = `32981`;
  const INTRO_TO_KONVIW_SLUG = `Introduction+to+Konviw`;
  const BLOG_POST_ID = '2021/04/04/10387469/';

  it(`/GET wiki page with ID only`, async () => {
    const res = await request(global.app.getHttpServer()).get(
      `/api/getPage/spaces/konviw/pages/${INTRO_TO_KONVIW_ID}`,
    );
    expect(res['res'].statusCode).toBe(200);
  });

  it(`/GET wiki page with ID and slug`, async () => {
    const res = await request(global.app.getHttpServer()).get(
      `/api/getPage/spaces/konviw/pages/${INTRO_TO_KONVIW_ID}/${INTRO_TO_KONVIW_SLUG}`,
    );
    expect(res['res'].statusCode).toBe(200);
  });

  it(`/GET blog page with date and ID`, async () => {
    const res = await request(global.app.getHttpServer()).get(
      `/api/getPage/spaces/konviw/blog/${BLOG_POST_ID}`,
    );
    expect(res['res'].statusCode).toBe(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
