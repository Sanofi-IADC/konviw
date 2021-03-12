import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import Config from '../../config/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addCustomCss');
    const $ = context.getCheerioBody();
    const version = config.get<Config>('version');

    // $('head').append(
    //   '<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/aui/5.2/css/aui.css" media="all">',
    // );

    $('head').append(
      `<link rel="stylesheet" type="text/css" href="/css/custom.css?cache=${version}" />`,
    );

    // ! Do not insert internal CSS styles because the function removeUnnecessaryCode will remove them later
    context.getPerfMeasure('addCustomCss');
  };
};
