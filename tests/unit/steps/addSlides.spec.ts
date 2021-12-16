import { ContextService } from '../../../src/context/context.service';
import { ConfigService } from '@nestjs/config';
import addSlides from '../../../src/proxy-page/steps/addSlides';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / addSlides', () => {
  let context: ContextService;
  let config: ConfigService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);

    context.Init('XXX', '123456', 'dark');
  });

  it('should add slides', () => {
    const transition = 'slide';
    const step = addSlides(config, transition);
    const version = config.get('version');
    const basePath = config.get('web.basePath');
    context.setHtmlBody(
      `<html><head><title>test</title><style default-inline-css="">/* slides */</style></head><body><pre class="syntaxhighlighter-pre"><?php echo "hello world"; ?></pre></body></html>`,
    );

    const expectedResult = `<html><head><title>test</title><style default-inline-css="">/* slides */</style><link rel="stylesheet" href="${basePath}/reveal/reset.css?cache=${version}"><link rel="stylesheet" href="${basePath}/css/slides.css?cache=${version}"><link rel="stylesheet" href="${basePath}/reveal/reveal.css?cache=${version}"><link rel="stylesheet" href="${basePath}/reveal/theme/.css?cache=${version}" id="theme"><link href="${basePath}/highlight/zenburn.min.css?cache=${version}" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"></head><body><pre><code><!--?php echo "hello world"; ?--></code></pre><script defer="" src="${basePath}/reveal/reveal.js?cache=${version}"></script><script defer="" src="${basePath}/reveal/plugin/zoom/zoom.js?cache=${version}"></script>
      <script defer="" src="${basePath}/reveal/plugin/highlight/highlight.js?cache=${version}"></script>
      <script defer="">
        document.addEventListener('DOMContentLoaded', function () {
          Reveal.initialize({
            hash: true,
            history: true,
            center: false,
            plugins: [ RevealZoom, RevealHighlight],
            transition: '${transition}',
            backgroundTransition: '${transition}',
            slideNumber: 'c/t',
            disableLayout: false,
            // This will make the slide responsive
            margin: 0.1,
            width: "100%",
            height: "100%",
            minScale: 1,
            maxScale: 1
          });
        })
      </script></body></html>`;
    step(context);
    expect(context.getHtmlBody()).toEqual(expectedResult);
  });
});
