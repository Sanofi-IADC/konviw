import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

// Images that already open their own zoom/lightbox experience (drawio diagrams,
// images explicitly marked '(zoom)' via addZoom) are excluded so a click does not
// trigger two competing handlers. Emoticons and inline icons are excluded because
// they are part of the text flow, not thumbnails meant to be viewed full-size.
const MODAL_ZOOMABLE_IMAGE_SELECTOR = 'img'
  + ':not(.emoticon)'
  + ':not(.confluence-content-image-inline)'
  + ':not(.drawio-zoomable)'
  + ':not(.konviw-image-zoom-effect)';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addImageModal');
  const $ = context.getCheerioBody();

  const zoomableImages = $(MODAL_ZOOMABLE_IMAGE_SELECTOR);

  if (zoomableImages.length > 0) {
    zoomableImages.each((_index: number, image: cheerio.Element) => {
      $(image).addClass('konviw-image-modal-zoomable');
    });

    // The modal image is created client-side (not in the server HTML) so that
    // earlier link/image steps (e.g. fixLinks, which hides <img> tags that have
    // an empty src) cannot tamper with it before we set its src on click.
    $('body').append(
      '<div id="konviw-image-modal" class="konviw-image-modal" role="dialog" aria-modal="true" aria-label="Image preview">'
      + '<button type="button" class="konviw-image-modal-close" aria-label="Close">&times;</button>'
      + '</div>',
    );
    $('body').append(`<script defer>
      document.addEventListener('DOMContentLoaded', function () {
        var modal = document.getElementById('konviw-image-modal');
        if (!modal) { return; }
        var modalImg = document.createElement('img');
        modalImg.className = 'konviw-image-modal-img';
        modal.appendChild(modalImg);
        var open = function (src, alt) {
          modalImg.setAttribute('src', src);
          modalImg.setAttribute('alt', alt || '');
          modal.classList.add('is-open');
        };
        var close = function () {
          modal.classList.remove('is-open');
          modalImg.setAttribute('src', '');
        };
        document.addEventListener('click', function (e) {
          var target = e.target;
          if (target && target.classList && target.classList.contains('konviw-image-modal-zoomable')) {
            e.preventDefault();
            open(target.currentSrc || target.src, target.getAttribute('alt'));
          } else if (target === modal || (target.classList && target.classList.contains('konviw-image-modal-close'))) {
            close();
          }
        });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') { close(); }
        });
      });
    </script>`);
  }

  context.getPerfMeasure('addImageModal');
};
