import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

/**
 * ### Proxy page step to improve the visualization of the iframe macro with a maximize effect to the full size of the viewport
 * @returns void
 */
export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixFrameAllowFullscreen');
    const $ = context.getCheerioBody();

    // Processing the iframes in the page
    $('iframe').each((_index: number, elementFrame: cheerio.TagElement) => {
      // allow fullscreen and other feature-policy features
      $(elementFrame).attr(
        'allow',
        'autoplay; fullscreen; encrypted-media; accelerometer; gyroscope; picture-in-picture',
      );
      $(elementFrame).attr('allowfullscreen', '');
      $(elementFrame).attr('webkitallowfullscreen', '');
      $(elementFrame).attr('mozAllowFullScreen', '');

      // lazy loading in modern browsers
      $(elementFrame).attr('loading', 'auto');
      // The Referer header will be omitted: sent requests do not include any referrer information
      $(elementFrame).attr('referrerpolicy', 'no-referrer');

      // if aspect ratio and 100% are both as properties then
      // we make the iframe responsive to the defined aspect ratio
      if (
        ['16:9', '4:3'].includes($(elementFrame).attr('name')) &&
        $(elementFrame).attr('width') === '100%'
      ) {
        $(elementFrame).attr(
          'style',
          'position: absolute; top: 0; left: 0; width: 100%; height: 100%; '.concat(
            $(elementFrame).attr('style') ?? '',
          ),
        );
        $(elementFrame).wrap(`<div style="width: 100%">`);
        if ($(elementFrame).attr('name') === '4:3') {
          // 4:3 aspect ratio means height is 3/4 times the width, which comes as 0.75 or 75%.
          $(elementFrame).wrap(
            `<div style="position: relative; padding-bottom: 75%">`,
          );
        } else {
          // 16:9 aspect ratio means height is 9/16 times the width, which comes as 0.5625 or 56.25%.
          $(elementFrame).wrap(
            `<div style="position: relative; padding-bottom: 56.25%">`,
          );
        }
        // height is not anymore needed in this case
        $(elementFrame).removeAttr('height');
      }

      if ($(elementFrame).attr('frameborder') === '1') {
        $(elementFrame).attr(
          'style',
          'border-radius: 10px; border: 2px solid #eee; '.concat(
            $(elementFrame).attr('style') ?? '',
          ),
        );
      }
    });

    context.getPerfMeasure('fixFrameAllowFullscreen');
  };
};
