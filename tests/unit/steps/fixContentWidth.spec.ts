import fixContentWidth from '../../../src/proxy-page/steps/fixContentWidth';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';

const example = '<html><head></head><body>...</body></html>';

describe('ConfluenceProxy / fixContentWidth', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
  });

  describe('when fullWidth is not set', () => {
    it('should do nothing', () => {
      const step = fixContentWidth();
      context.setHtmlBody(example);
      step(context);
      const $ = context.getCheerioBody();
      expect($('#Content').hasClass('fullWidth')).toBe(false);
    });
  });

  describe('when fullWidth is set to true', () => {
    it('should add a CSS class', () => {
      const step = fixContentWidth();
      context.setHtmlBody(example);
      context.setFullWidth(true);
      step(context);
      const $ = context.getCheerioBody();
      expect($('#Content').hasClass('fullWidth')).toBe(true);
    });
  });
});
