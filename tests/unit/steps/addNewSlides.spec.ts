import { ConfigService } from '@nestjs/config';
import { Content } from '../../../src/confluence/confluence.interface';
import { ContextService } from '../../../src/context/context.service';
import addNewSlides from '../../../src/proxy-page/steps/addNewSlides';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / addNewSlides', () => {
    let context: ContextService;
    let config: ConfigService;
    let content: Content;

    beforeEach(async () => {
        const moduleRef = await createModuleRefForStep();
        context = moduleRef.get<ContextService>(ContextService);
        config = moduleRef.get<ConfigService>(ConfigService);
    });

    it('Add New Slides without storage is empty', () => {
        content = { body: { storage: { value: '' } } } as any;
        const step = addNewSlides(config, content);
        context.setHtmlBody(
            `<html><head></head><body>` +
            `<div class="macro-conf" data-macro-name="slide">` +
            `<h1>title</h1>` +
            `<h3>small title</h3>` +
            `<span><pre class="syntaxhighlighter-pre"><?php echo "hello world"; ?></pre></span>` +
            `</div>` +
            `<hr />` +
            `<div class="macro-conf" data-macro-name="slide">` +
            `<h1>title</h1>` +
            `<h3>small title</h3>` +
            `<span><pre class="syntaxhighlighter-pre"><?php echo "hello world"; ?></pre></span>` +
            `</div>` +
            `</body></html>`,
        );
        const expectedResult = '<html><head></head><body><div id=\"Content\"><section id=\"slides-logo\">' +
            '</section><div class=\"reveal slide\"><div class=\"slides\"></div></div></div></body></html>'
        step(context);
        expect(context.getHtmlBody()).toEqual(expectedResult);
    });
});
