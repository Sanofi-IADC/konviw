import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addMessageBus');
    const $ = context.getCheerioBody();

    // Excerpt macro is parsed as a span block with classes 'conf-macro' and 'output-inline'
    // and data-macro-name='excerpt'
    // Unfortunately if the property hidden=true the styled_body will not return the excerpt
    $("span.conf-macro.output-inline[data-macro-name='excerpt']")
      .first()
      .each((_index: number, elementExcerpt: CheerioElement) => {
        const excerptPage = $(elementExcerpt);
        context.setExcerpt(excerptPage.text());
      });

    // TODO: Add the framebus library and pass messages to parent container
    // Pass title, url and excerpt
    // $('head').append(
    //   `<script>
    //   </script>`,
    // );

    context.getPerfMeasure('addMessageBus');
  };
};
