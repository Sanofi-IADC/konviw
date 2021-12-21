import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

/**
 * ### Proxy page step to add Video tag to display mp4 video attachments.
 *
 * This module gets Cheerio to search 'span.confluence-embedded-file-wrapper'
 * get the 'href' URL and append a 'video' html5 tag.
 * This step assumes an image with extension .webp and same name as the video can be
 * used to previsualize a picture when the video is not running.
 *
 * @param  {ConfigService} config
 * @returns void
 */
export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('fixVideo');
    const $ = context.getCheerioBody();

    // Div class with span.confluence-embedded-file-wrapper is used for images and videos
    // while only the videos come with an 'a' pointing to the video attachment.
    // This narrow filter improves the performance as now the function only goes thru the videos.
    $('span.confluence-embedded-file-wrapper a').each(
      (_index: number, fileWrapper: cheerio.Element) => {
        const searchMedia = new RegExp(
          `(\/.*)\/(.*).(mp4|avi|mov|flv|wmv|webm)`,
        );
        // Search for the path $1, title $2 and extension $3 (not used)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [, pathMedia, titleMedia, extMedia] =
          searchMedia.exec($(fileWrapper).attr('href')) ?? [];
        if (pathMedia) {
          // Append the video tag with src to the attachment and an image as poster
          $(fileWrapper)
            .parent()
            .append(
              `<video poster="${pathMedia}/${titleMedia}.jpg" controls><source src="${$(
                fileWrapper,
              ).attr('href')}" type="video/mp4"></video>`,
            );

          // TODO: this section with decodeURI is buggy in some cases. Replace by RegEx
          // Append the name of the file as caption for the video
          // $(fileWrapper)
          //   .parent()
          //   .append(
          //     `<span class="smalltext">${decodeURI(
          //       titleMedia,
          //     )}.${extMedia}</span>`,
          //   );

          $(fileWrapper).remove();
        }
      },
    );

    context.getPerfMeasure('fixVideo');
  };
};
