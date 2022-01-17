[1mdiff --git a/tests/e2e/proxy-api/proxy-api.e2e-spec.ts b/tests/e2e/proxy-api/proxy-api.e2e-spec.ts[m
[1mindex e806b13..4e6dc67 100644[m
[1m--- a/tests/e2e/proxy-api/proxy-api.e2e-spec.ts[m
[1m+++ b/tests/e2e/proxy-api/proxy-api.e2e-spec.ts[m
[36m@@ -11,6 +11,8 @@[m [mdescribe('proxy-api', () => {[m
   const INTRO_TO_KONVIW_SLUG = `Introduction+to+Konviw`;[m
   const BLOG_POST_ID = '2021/04/04/10387469';[m
 [m
[32m+[m[32m  const HTML_DIV_REGEXP = /^<div id="Content">/;[m
[32m+[m
   it(`/GET wiki page with ID only, body begins with Content div and page content matches`, async () => {[m
     const res = await request(global.app.getHttpServer()).get([m
       `/api/spaces/konviw/pages/${INTRO_TO_KONVIW_ID}`,[m
[36m@@ -18,17 +20,11 @@[m [mdescribe('proxy-api', () => {[m
 [m
     expect(res.statusCode).toBe(HttpStatus.OK);[m
 [m
[31m-    const page = res.body as Partial<KonviwContent>;[m
[31m-    expect(page.title).toEqual('Introduction to Konviw');[m
[31m-    expect(page).toHaveProperty([m
[31m-      'body',[m
[31m-      expect.stringMatching(/^<div id="Content">/),[m
[31m-    );[m
[31m-    expect(page).toHaveProperty([m
[31m-      'body',[m
[31m-      expect.stringContaining([m
[31m-        'Konviw is an open source public viewer for Confluence pages in Enterprise private networks created by Sanofi IADC. We created it to provide an easy way for our end users to read Confluence pages without the clutter of going to Confluence.',[m
[31m-      ),[m
[32m+[m[32m    checkBasicPageEquality([m
[32m+[m[32m      res.body as Partial<KonviwContent>,[m
[32m+[m[32m      'Introduction to Konviw',[m
[32m+[m[32m      'Konviw is an open source public viewer for Confluence pages in Enterprise private networks created by Sanofi IADC. We created it to provide an easy way for our end users to read Confluence pages without the clutter of going to Confluence.',[m
[32m+[m[32m      HTML_DIV_REGEXP,[m
     );[m
   });[m
 [m
[36m@@ -38,8 +34,12 @@[m [mdescribe('proxy-api', () => {[m
     );[m
     expect(res.statusCode).toBe(HttpStatus.OK);[m
 [m
[31m-    const page = res.body as Partial<KonviwContent>;[m
[31m-    expect(page.title).toEqual('Introduction to Konviw');[m
[32m+[m[32m    checkBasicPageEquality([m
[32m+[m[32m      res.body as Partial<KonviwContent>,[m
[32m+[m[32m      'Introduction to Konviw',[m
[32m+[m[32m      'Konviw is an open source public viewer for Confluence pages in Enterprise private networks created by Sanofi IADC. We created it to provide an easy way for our end users to read Confluence pages without the clutter of going to Confluence.',[m
[32m+[m[32m      HTML_DIV_REGEXP,[m
[32m+[m[32m    );[m
   });[m
 [m
   it(`/GET blog page with date and ID, body begins with Content div and page content matches`, async () => {[m
[36m@@ -48,18 +48,11 @@[m [mdescribe('proxy-api', () => {[m
     );[m
     expect(res.statusCode).toBe(HttpStatus.OK);[m
 [m
[31m-    const page = res.body as Partial<KonviwContent>;[m
[31m-    expect(page.title).toEqual('How to write a blog post with konviw');[m
[31m-[m
[31m-    expect(page).toHaveProperty([m
[31m-      'body',[m
[31m-      expect.stringMatching(/^<div id="Content">/),[m
[31m-    );[m
[31m-    expect(page).toHaveProperty([m
[31m-      'body',[m
[31m-      expect.stringContaining([m
[31m-        'For each post, I made sure to identify what my readers want to read and to define the problem that they want to solve. Additionally, I challenge myself to always produce quality content. That should be your #1 priority.',[m
[31m-      ),[m
[32m+[m[32m    checkBasicPageEquality([m
[32m+[m[32m      res.body as Partial<KonviwContent>,[m
[32m+[m[32m      'How to write a blog post with konviw',[m
[32m+[m[32m      'For each post, I made sure to identify what my readers want to read and to define the problem that they want to solve. Additionally, I challenge myself to always produce quality content. That should be your #1 priority.',[m
[32m+[m[32m      HTML_DIV_REGEXP,[m
     );[m
   });[m
 [m
[36m@@ -70,6 +63,17 @@[m [mdescribe('proxy-api', () => {[m
     expect(res.statusCode).toBe(HttpStatus.NOT_FOUND);[m
   });[m
 [m
[32m+[m[32m  function checkBasicPageEquality([m
[32m+[m[32m    page: Partial<KonviwContent>,[m
[32m+[m[32m    expectedTitle: string,[m
[32m+[m[32m    expectedText: string,[m
[32m+[m[32m    expectedDivWrap: string | RegExp,[m
[32m+[m[32m  ) {[m
[32m+[m[32m    expect(page.title).toEqual(expectedTitle);[m
[32m+[m[32m    expect(page).toHaveProperty('body', expect.stringMatching(expectedDivWrap));[m
[32m+[m[32m    expect(page).toHaveProperty('body', expect.stringContaining(expectedText));[m
[32m+[m[32m  }[m
[32m+[m
   afterAll(async () => {[m
     await app.close();[m
   });[m
