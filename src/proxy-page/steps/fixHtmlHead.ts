import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixHtmlHead');
    const $ = context.getCheerioBody();
    const basePath = config.get('web.basePath');

    $('head').prepend(
      `<meta name="description" content="konviw • Enterprise public viewer for Confluence pages.">`,
      `<meta property="og:image" content="${basePath}/favicon/konviw.png">`,
      `<meta property="og:title" content="${context.getTitle()}">`,
      `<meta property="og:description" content="Enterprise public viewer for your Confluence pages.">`,
      `<meta property="og:url" content="https://sanofi-iadc.github.io/konviw/">`,
      `<meta property="og:site_name" content="konviw">`,
      `<meta name="twitter:card" content="summary">`,
      `<meta name="twitter:site" content="konviw">`,
      `<meta name="twitter:title" content="${context.getTitle()}">`,
      `<meta name="twitter:description" content="konviw • Enterprise public viewer for Confluence pages.">`,
      `<meta name="twitter:creator" content="${context.getAuthor()}">`,
      `<meta name="twitter:image" content="${basePath}/favicon/konviw.png">`,
      `<title>${context.getTitle()}</title>`,
    );

    $('head').prepend(
      `<link rel="apple-touch-icon" sizes="120x120" href="${basePath}/favicon/apple-touch-icon.png">`,
      `<link rel="icon" type="image/png" sizes="32x32" href="${basePath}/favicon/favicon-32x32.png">`,
      `<link rel="icon" type="image/png" sizes="16x16" href="${basePath}/favicon/favicon-16x16.png">`,
      `<link rel="shortcut icon" href="${basePath}/favicon/favicon.ico">`,
    );

    $('head').prepend(
      `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">`,
    );

    context.getPerfMeasure('fixHtmlHead');
  };
};
