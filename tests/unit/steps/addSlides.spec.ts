import { ContextService } from '../../../src/context/context.service';
import addSlides from '../../../src/proxy-page/steps/addSlides';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / addSlides', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);

    context.initPageContext('XXX', '123456', 'dark');
  });

  it('should add slides', () => {
    const step = addSlides();
    context.setHtmlBody(
      `<html><head></head><body>` +
        `<div class="plugin-tabmeta-details" data-macro-name="details">` +
        `<h1>title</h1>` +
        `<h3>small title</h3>` +
        `<span><pre class="syntaxhighlighter-pre"><?php echo "hello world"; ?></pre></span>` +
        `</div>` +
        `<hr />` +
        `<div class="plugin-tabmeta-details" data-macro-name="details">` +
        `<h1>title</h1>` +
        `<h3>small title</h3>` +
        `<span><pre class="syntaxhighlighter-pre"><?php echo "hello world"; ?></pre></span>` +
        `</div>` +
        `</body></html>`,
    );

    const expectedResult =
      `<html><head></head>` +
      `<body><div id="Content">` +
      `<section id="slides-logo"></section>` +
      `<div class="reveal slide">` +
      `<div class="slides"><section data-state="cover"><h1>title</h1>` +
      `<h3>small title</h3>` +
      `<span><pre><code><!--?php echo "hello world"; ?--></code></pre></span>` +
      `</section><section data-state="cover"><h1>title</h1>` +
      `<h3>small title</h3>` +
      `<span><pre><code><!--?php echo "hello world"; ?--></code></pre></span>` +
      `</section></div>` +
      `</div></div>` +
      `</body></html>`;
    step(context);
    expect(context.getHtmlBody()).toEqual(expectedResult);
  });
});
