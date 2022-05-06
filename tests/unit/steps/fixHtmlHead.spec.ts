import { Step } from 'src/proxy-page/proxy-page.step';
import { ContextService } from '../../../src/context/context.service';
import { ConfigService } from '@nestjs/config';
import fixHtmlHead from '../../../src/proxy-page/steps/fixHtmlHead';
import { createModuleRefForStep } from './utils';

describe('Confluence Proxy / addTheme', () => {
  let context: ContextService;
  let config: ConfigService;
  let step: Step;
  let basePath: string;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    basePath = config.get('web.basePath');
    step = fixHtmlHead(config);
  });

  it('should add dark theme', () => {
    context.initPageContext('XXX', '123456', 'dark');
    context.setHtmlBody('<html><head></head><body>BODY CONTENT</body></html>');
    context.setTitle('This is the title');
    step(context);
    expect(context.getHtmlBody()).toEqual(
      `<html><head>` +
        `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
        `<link rel="apple-touch-icon" sizes="120x120" href="${basePath}/favicon/apple-touch-icon.png">` +
        `<link rel="icon" type="image/png" sizes="32x32" href="${basePath}/favicon/favicon-32x32.png">` +
        `<link rel="icon" type="image/png" sizes="16x16" href="${basePath}/favicon/favicon-16x16.png">` +
        `<link rel="shortcut icon" href="${basePath}/favicon/favicon.ico">` +
        `<meta name="description" content="konviw • Enterprise public viewer for Confluence pages.">` +
        `<meta property="og:image" content="${basePath}/favicon/konviw.png">` +
        `<meta property="og:title" content="${context.getTitle()}">` +
        `<meta property="og:description" content="Enterprise public viewer for your Confluence pages.">` +
        `<meta property="og:url" content="https://sanofi-iadc.github.io/konviw/">` +
        `<meta property="og:site_name" content="konviw">` +
        `<meta name="twitter:card" content="summary">` +
        `<meta name="twitter:site" content="konviw">` +
        `<meta name="twitter:title" content="${context.getTitle()}">` +
        `<meta name="twitter:description" content="konviw • Enterprise public viewer for Confluence pages.">` +
        `<meta name="twitter:creator" content="${context.getAuthor()}">` +
        `<meta name="twitter:image" content="${basePath}/favicon/konviw.png">` +
        `<title>This is the title</title></head><body><div id="Content">BODY CONTENT</div></body></html>`,
    );
  });
});
