import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import Config from '../../config/config';
import fs from 'fs';
import { join, dirname } from 'path';

export default (config: ConfigService, style?: string): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addCustomCss');
    const $ = context.getCheerioBody();
    const version = config.get<Config>('version');
    const basePath = config.get<Config>('web.basePath');

    let cssPath = `${basePath}/css/custom.css?cache=${version}`;
    const path = `${dirname(
      require.main.filename,
    )}/../static/css/${style}/custom.css`;
    if (fs.existsSync(path)) {
      cssPath = `${basePath}/css/${style}/custom.css?cache=${version}`;
    }

    $('head').append(
      `<link rel="stylesheet" type="text/css" href="${cssPath}" />`,
    );

    // ! Do not insert internal CSS styles because the function removeUnnecessaryCode will remove them later
    context.getPerfMeasure('addCustomCss');
  };
};
