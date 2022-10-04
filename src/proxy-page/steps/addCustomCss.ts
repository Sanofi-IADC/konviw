import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import { resolve } from 'path';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';

export default (config: ConfigService, style?: string): Step => (context: ContextService): void => {
  context.setPerfMark('addCustomCss');
  const $ = context.getCheerioBody();
  const version = config.get('version');
  const basePath = config.get('web.basePath');

  let cssPath = `${basePath}/css/custom.css?cache=${version}`;

  if (
    fs.existsSync(
      resolve(__dirname, `../../../static/css/${style}/custom.css`),
    )
  ) {
    cssPath = `${basePath}/css/${style}/custom.css?cache=${version}`;
  }

  $('head').append(
    `<link rel="stylesheet" type="text/css" href="${cssPath}">`,
    `<link href="${basePath}/css/all.min.css?cache=${version}" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'">`,
  );

  /* Adding debug stylesheet */
  if (context.getView() === 'debug') {
    const debugCssPath = `${basePath}/css/debug.css?cache=${version}`;
    $('head').append(
      `<link rel="stylesheet" type="text/css" href="${debugCssPath}">`,
    );
  }

  // ! Do not insert inline CSS styles because the function delUnnecessaryCode will remove them later
  context.getPerfMeasure('addCustomCss');
};
