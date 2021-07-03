import { Step } from 'src/proxy-page/proxy-page.step';
import { ContextService } from '../../../src/context/context.service';
import addTheme from '../../../src/proxy-page/steps/addTheme';
import { createModuleRefForStep } from './utils';

describe('Confluence Proxy / addTheme', () => {
  let context: ContextService;
  let step: Step;

  beforeEach(async () => {
    step = addTheme();
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
  });

  it('should add dark theme', () => {
    context.Init('XXX', '123456', 'dark');
    context.setHtmlBody(
      '<html><head><title>test</title><style default-inline-css="">/* confluence CSS */</style></head><body></body></html>',
    );
    step(context);
    expect(context.getHtmlBody())
      .toEqual(`<html><head><title>test</title><style default-inline-css="">/* confluence CSS */</style></head><body><script type="module">
            document.addEventListener('DOMContentLoaded', function () {
              document.documentElement.setAttribute('data-theme', 'dark');
              localStorage.setItem('theme', 'dark');
            })
          </script></body></html>`);
  });

  it('should add light theme', () => {
    context.Init('XXX', '123456', 'light');
    context.setHtmlBody(
      '<html><head><title>test</title><style default-inline-css="">/* confluence CSS */</style></head><body></body></html>',
    );
    step(context);
    expect(context.getHtmlBody())
      .toEqual(`<html><head><title>test</title><style default-inline-css="">/* confluence CSS */</style></head><body><script type="module">
            document.addEventListener('DOMContentLoaded', function () {
              document.documentElement.setAttribute('data-theme', 'light');
              localStorage.setItem('theme', 'light');
            })
          </script></body></html>`);
  });
});
