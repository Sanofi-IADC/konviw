import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import Config from '../../config/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addZooming');
    const $ = context.getCheerioBody();
    const version = config.get<Config>('version');

    // Library to include the zooming effect to Drawio images
    // https://unpkg.com/zooming@2.1.1/build/zooming.min.js
    // When the DOM content is loaded call the initialization of the Zooming library
    $('body').append(
      `<script defer src="/zooming/zooming-2.1.1.min.js?cache=${version}"></script>
      <script type="module">
        document.addEventListener('DOMContentLoaded', function () {
          new Zooming({}).listen('.img-zoomable');
          new Zooming({}).listen('.confluence-embedded-image')
        })
      </script>`,
    );
    context.getPerfMeasure('addZooming');
  };
};
