import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import { ConfigService } from '@nestjs/config';
import Config from '../../config/config';

export default (config: ConfigService): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addMessageBus');
    const $ = context.getCheerioBody();
    const version = config.get<Config>('version');

    // Excerpt macro is parsed as a span block with classes 'conf-macro' and 'output-inline'
    // and data-macro-name='excerpt'
    // Unfortunately if the property hidden=true the styled_body will not return the excerpt
    // TODO: Probably this part would be better in a context.SetMetadata dedicated step
    $("span.conf-macro.output-inline[data-macro-name='excerpt']")
      .first()
      .each((_index: number, elementExcerpt: CheerioElement) => {
        const excerptPage = $(elementExcerpt);
        context.setExcerpt(excerptPage.text());
      });

    // Load framebus library and emit to the bus 'iframe-konviw' title, url and description
    const slug = context.getSpaceKey().toLowerCase();
    $('body').append(
      `<script defer src="/framebus/framebus.js?cache=${version}"></script>
      <script type="module">
        const bus = new Framebus();        
        bus.emit("iframe-konviw", {
          url: {iadc_url:"${slug}/${context.getPageId()}", public_url: window.location.href},
          page: {title:"${context.getTitle()}", 
          description: "${context.getExcerpt()}"}
        });
      </script>`,
    );

    context.getPerfMeasure('addMessageBus');
  };
};
