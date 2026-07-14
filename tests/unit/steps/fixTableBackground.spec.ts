import { Step } from '../../../src/proxy-page/proxy-page.step';
import { ContextService } from '../../../src/context/context.service';
import fixTableBackground from '../../../src/proxy-page/steps/fixTableBackground';
import { createModuleRefForStep } from './utils';

const cell = (attrs: string) =>
  `<table><tbody><tr><td class="confluenceTd" ${attrs}>text</td></tr></tbody></table>`;

describe('Confluence Proxy / fixTableBackground', () => {
  let context: ContextService;
  let step: Step;

  beforeEach(async () => {
    step = fixTableBackground();
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
  });

  const run = (html: string): string => {
    context.setHtmlBody(`<html><head></head><body>${html}</body></html>`);
    step(context);
    return context.getHtmlBody();
  };

  it('applies the highlight colour as the cell background', () => {
    expect(run(cell('data-highlight-colour="#ffffff"'))).toContain(
      'background-color: #ffffff',
    );
  });

  it('darkens the text on a light cell so it stays readable in dark theme', () => {
    expect(run(cell('data-highlight-colour="#ffffff"'))).toContain(
      'color: #172b4d',
    );
  });

  it('lightens the text on a dark cell background', () => {
    expect(run(cell('data-highlight-colour="#172b4d"'))).toContain(
      'color: #ffffff',
    );
  });

  it('resolves brightness for shorthand 3-digit hex', () => {
    expect(run(cell('data-highlight-colour="#fff"'))).toContain('color: #172b4d');
  });

  it('leaves cells without an explicit background untouched', () => {
    const html = run(cell('class="highlight-grey"'));
    expect(html).not.toContain('color: #');
    expect(html).not.toContain('background-color:');
  });

  it('does not force a text colour when the value is not a parseable hex', () => {
    const html = run(cell('data-highlight-colour="rebeccapurple"'));
    // background is still applied verbatim, but no guessed text colour
    expect(html).toContain('background-color: rebeccapurple');
    expect(html).not.toContain('color: #');
  });
});
