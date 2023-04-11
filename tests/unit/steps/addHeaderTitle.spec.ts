import { ContextService } from '../../../src/context/context.service';
import addHeaderTitle from '../../../src/proxy-page/steps/addHeaderTitle';
import { createModuleRefForStep } from './utils';

const example =
  '<html><head></head><body><div id="Content" style="padding: 5px;"><p>test</p></div></body></html>';

describe('ConfluenceProxy / addHeaderTitle', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);

    context.initPageContext('XXX', '123456', 'dark');
  });

  it('should add just the h1 title', () => {
    const step = addHeaderTitle();
    context.setTitle('I am the title');
    context.setHtmlBody(example);
    step(context);
    expect(context.getHtmlBody()).toContain(
      '<h1 class="titlePage"> I am the title</h1>',
    );
  });

  it('should add the h1 title and emoji', () => {
    const step = addHeaderTitle();
    context.setTitle('I am the title');
    context.setHeaderEmoji('1f60d');
    context.setHtmlBody(example);
    step(context);
    expect(context.getHtmlBody()).toContain(
      '<h1 class="titlePage">😍 I am the title</h1>',
    );
  });

  it('should add the h1 title and special atlassian emoji with image element', () => {
    const step = addHeaderTitle();
    context.setTitle('I am the title');
    context.setHeaderEmoji('atlassian_question_mark');
    context.setHtmlBody(example);
    step(context);
    expect(context.getHtmlBody()).toContain('I am the title');
    expect(context.getHtmlBody()).toContain('question_mark_32.png');
  });
});
