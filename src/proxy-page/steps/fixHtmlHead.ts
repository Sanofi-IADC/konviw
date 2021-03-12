import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixHtmlHead');
    const $ = context.getCheerioBody();

    $('head').prepend(
      `<link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png">
      <link rel="shortcut icon" href="/favicon/favicon.ico">`,
    );

    $('head').prepend(
      '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
    );

    context.getPerfMeasure('fixHtmlHead');
  };
};
