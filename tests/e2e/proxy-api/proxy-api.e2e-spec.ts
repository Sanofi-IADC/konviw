import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { KonviwContent } from 'src/proxy-api/proxy-api.interface';

describe('proxy-api', () => {
  let app: INestApplication;

  // page IDs from official Konviw Confluence for e2e tests
  // use this testing method sparingly as changes to the content can break tests
  const INTRO_TO_KONVIW_ID = `32981`;
  const INTRO_TO_KONVIW_SLUG = `Introduction+to+Konviw`;
  const BLOG_POST_ID = '2021/04/04/10387469/';

  it(`/GET wiki page with ID only, html_body begins with Content div and page content matches`, async () => {
    const res = await request(global.app.getHttpServer()).get(
      `/api/getPage/spaces/konviw/pages/${INTRO_TO_KONVIW_ID}`,
    );

    expect(res['res'].statusCode).toBe(200);

    const page = res.body as Partial<KonviwContent>;
    expect(page.title).toEqual('Introduction to Konviw');
    expect(page).toHaveProperty(
      'html_body',
      expect.stringMatching(/^<div id="Content">/),
    );
    expect(page).toHaveProperty(
      'html_body',
      expect.stringContaining(
        'Konviw is an open source public viewer for Confluence pages in Enterprise private networks created by Sanofi IADC. We created it to provide an easy way for our end users to read Confluence pages without the clutter of going to Confluence.',
      ),
    );
  });

  it(`/GET wiki page with ID and slug, html_body begins with Content div and page content matches`, async () => {
    const res = await request(global.app.getHttpServer()).get(
      `/api/getPage/spaces/konviw/pages/${INTRO_TO_KONVIW_ID}/${INTRO_TO_KONVIW_SLUG}`,
    );
    expect(res['res'].statusCode).toBe(200);

    const page = res.body as Partial<KonviwContent>;
    expect(page.title).toEqual('Introduction to Konviw');
  });

  it(`/GET blog page with date and ID, html_body begins with Content div and page content matches`, async () => {
    const res = await request(global.app.getHttpServer()).get(
      `/api/getPage/spaces/konviw/blog/${BLOG_POST_ID}`,
    );
    expect(res['res'].statusCode).toBe(200);

    const page = res.body as Partial<KonviwContent>;
    expect(page.title).toEqual('How to write a blog post with konviw');

    expect(page).toHaveProperty(
      'html_body',
      expect.stringMatching(/^<div id="Content">/),
    );
    expect(page).toHaveProperty(
      'html_body',
      expect.stringContaining(
        'For each post, I made sure to identify what my readers want to read and to define the problem that they want to solve. Additionally, I challenge myself to always produce quality content. That should be your #1 priority.',
      ),
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
