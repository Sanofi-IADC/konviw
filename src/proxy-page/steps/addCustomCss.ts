import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import { dirname } from 'path';

export default (config: ConfigService, style?: string): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addCustomCss');
    const $ = context.getCheerioBody();
    const version = config.get('version');
    const basePath = config.get('web.basePath');

    let cssPath = `${basePath}/css/custom.css?cache=${version}`;
    const path = `${dirname(
      require.main.filename,
    )}/../static/css/${style}/custom.css`;
    if (fs.existsSync(path)) {
      cssPath = `${basePath}/css/${style}/custom.css?cache=${version}`;
    }

    $('head').append(
      `<link rel="stylesheet" type="text/css" href="${cssPath}">`,
      `<link href="${basePath}/css/all.min.css?cache=${version}" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'">`,
      // `<link href="${cssPath}" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"/>`,
    );

    // ! Do not insert inline CSS styles because the function removeUnnecessaryCode will remove them later
    context.getPerfMeasure('addCustomCss');
  };
};
