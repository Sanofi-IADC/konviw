import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { KonviwContent } from '../../../src/proxy-api/proxy-api.interface';
import { AppModule } from '../../../src/app.module';

describe('proxy-api', () => {
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

  // page IDs from official Konviw Confluence for e2e tests
  // use this testing method sparingly as changes to the content in Confluence can easily break tests
  const INTRO_TO_KONVIW_ID = `32981`;
  const INTRO_TO_KONVIW_SLUG = `Introduction+to+Konviw`;
  const BLOG_POST_ID = '2021/04/04/10387469';

  const HTML_DIV_REGEXP = /^<div id="Content">/;

  it(`/GET wiki page with ID only, body begins with Content div and page content matches`, async () => {
    const res = await request(app.getHttpServer()).get(
      `/api/spaces/konviw/pages/${INTRO_TO_KONVIW_ID}`,
    );

    expect(res.statusCode).toBe(HttpStatus.OK);

    checkBasicPageEquality(
      res.body as Partial<KonviwContent>,
      'Introduction to Konviw',
      'Konviw is an open source public viewer for Confluence pages in Enterprise private networks created by Sanofi IADC. We created it to provide an easy way for our end users to read Confluence pages without the clutter of going to Confluence.',
      HTML_DIV_REGEXP,
    );
  });

  it(`/GET wiki page with ID and slug, body begins with Content div and page content matches`, async () => {
    const res = await request(app.getHttpServer()).get(
      `/api/spaces/konviw/pages/${INTRO_TO_KONVIW_ID}/${INTRO_TO_KONVIW_SLUG}`,
    );
    expect(res.statusCode).toBe(HttpStatus.OK);

    checkBasicPageEquality(
      res.body as Partial<KonviwContent>,
      'Introduction to Konviw',
      'Konviw is an open source public viewer for Confluence pages in Enterprise private networks created by Sanofi IADC. We created it to provide an easy way for our end users to read Confluence pages without the clutter of going to Confluence.',
      HTML_DIV_REGEXP,
    );
  });

  it(`/GET blog page with date and ID, body begins with Content div and page content matches`, async () => {
    const res = await request(app.getHttpServer()).get(
      `/api/spaces/konviw/blog/${BLOG_POST_ID}`,
    );
    expect(res.statusCode).toBe(HttpStatus.OK);

    checkBasicPageEquality(
      res.body as Partial<KonviwContent>,
      'How to write a blog post with konviw',
      'For each post, I made sure to identify what my readers want to read and to define the problem that they want to solve. Additionally, I challenge myself to always produce quality content. That should be your #1 priority.',
      HTML_DIV_REGEXP,
    );
  });

  it(`/GET returns 400 with invalid page ID`, async () => {
    const res = await request(global.app.getHttpServer()).get(
      `/api/spaces/konviw/pages/0000`,
    );
    expect(res.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  function checkBasicPageEquality(
    page: Partial<KonviwContent>,
    expectedTitle: string,
    expectedText: string,
    expectedDivWrap: string | RegExp,
  ) {
    expect(page.title).toEqual(expectedTitle);
    expect(page).toHaveProperty('body', expect.stringMatching(expectedDivWrap));
    expect(page).toHaveProperty('body', expect.stringContaining(expectedText));
  }
});
