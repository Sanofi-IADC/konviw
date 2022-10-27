import { ConfigService } from '@nestjs/config';
import { Content } from '../../../src/confluence/confluence.interface';
import { ContextService } from '../../../src/context/context.service';
import addNewSlides from '../../../src/proxy-page/steps/addNewSlides';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / addNewSlides', () => {
    let context: ContextService;
    let config: ConfigService;
    let content: Content & { body: { storage: { value: string } } } = { body: { storage: { value: '' } } } as any;

    beforeEach(async () => {
        const moduleRef = await createModuleRefForStep();
        context = moduleRef.get<ContextService>(ContextService);
        content.body.storage.value = '<ac:structured-macro ac:name="slideSettings" ac:schema-version="1" data-layout="default" ' +
        'ac:local-id="141105b0-1baf-44ce-9c96-27004ad82793" ac:macro-id="00d0b33919f6759e73e5e7699a6238fc">' +
        '<ac:parameter ac:name="slide_settings_title">Test</ac:parameter><ac:parameter ac:name="slide_settings_theme">' +
        'iadc</ac:parameter><ac:parameter ac:name="slide_settings_transition">convex</ac:parameter>' +
        '</ac:structured-macro><ac:structured-macro ac:name="slide" ac:schema-version="1" data-layout="default"' +
        'ac:local-id="08712a20-759f-474f-ad92-b7367ec870de" ac:macro-id="739f386baadf4e2f03b2ee44ce8b5b82">' +
        '<ac:parameter ac:name="slide_type">bubble</ac:parameter><ac:parameter ac:name="slide_id">1</ac:parameter>' +
        '<ac:parameter ac:name="slide_transition">concave</ac:parameter><ac:parameter ac:name="slide_background_attachment">' +
        '<ri:attachment ri:filename="1529923467_Javascript.png" ri:version-at-save="1" /></ac:parameter>' +
        '<ac:rich-text-body><p>Content of slide</p></ac:rich-text-body></ac:structured-macro><p />';
        config = moduleRef.get<ConfigService>(ConfigService);
        context.initPageContext('XXX', '123456', 'dark');
    });

    it('Add new slides parameters defined in slide macro are overriding slide deck', () => {
        const mockBody = '<div class="conf-macro output-block" data-hasbody="false" data-layout="default"' +
        'data-local-id="141105b0-1baf-44ce-9c96-27004ad82793" data-macro-id="00d0b33919f6759e73e5e7699a6238fc"' +
        'data-macro-name="slideSettings"></div><div class="conf-macro output-block" data-hasbody="true"' +
        'data-layout="default" data-local-id="08712a20-759f-474f-ad92-b7367ec870de" data-macro-id="e8dea08a24d1c4cb8a2be48f9e7de56c"' +
        'data-macro-name="slide"><p>Content of slide</p></div><p />';
        content.getCheerioBody = () => mockBody;
        context.setHtmlBody(mockBody);
        addNewSlides(config, content)(context);
        expect(context.getHtmlBody().includes('data-transition="concave"')).toBe(true);
    });

    it('Add new slides is not rendering without body', () => {
        const mockBody = '';
        content.getCheerioBody = () => mockBody;
        context.setHtmlBody(mockBody);
        addNewSlides(config, content)(context);
        const result = '<html><head></head><body><div id="Content"><section id="slides-logo"></section>' +
        '<div class="reveal slide"><div class="slides"></div></div></div></body></html>';
        expect(context.getHtmlBody()).toEqual(result);
    });

    it('Add new slides contains background attachment if defined in storage', () => {
        const mockBody = '<div class="conf-macro output-block" data-hasbody="false" data-layout="default"' +
        'data-local-id="141105b0-1baf-44ce-9c96-27004ad82793" data-macro-id="00d0b33919f6759e73e5e7699a6238fc"' +
        'data-macro-name="slideSettings"></div><div class="conf-macro output-block" data-hasbody="true"' +
        'data-layout="default" data-local-id="08712a20-759f-474f-ad92-b7367ec870de"' +
        'data-macro-id="e8dea08a24d1c4cb8a2be48f9e7de56c" data-macro-name="slide"><p>Content of slide</p></div><p />';
        content.getCheerioBody = () => mockBody;
        context.setHtmlBody(mockBody);
        addNewSlides(config, content)(context);
        console.log(context.getHtmlBody())
        const fileAttribiute = 'data-background-image="'
        const fileName = '1529923467_Javascript.png'
        const htmlBody = context.getHtmlBody();
        expect(htmlBody.includes(fileAttribiute) && htmlBody.includes(fileName)).toBe(true);
    });

    it('Add new slides is displaying content of slide macro', () => {
        const mockBody = '<div class="conf-macro output-block" data-hasbody="false" data-layout="default"' +
        'data-local-id="141105b0-1baf-44ce-9c96-27004ad82793" data-macro-id="00d0b33919f6759e73e5e7699a6238fc"' +
        'data-macro-name="slideSettings"></div><div class="conf-macro output-block" data-hasbody="true"' +
        'data-layout="default" data-local-id="08712a20-759f-474f-ad92-b7367ec870de" data-macro-id="e8dea08a24d1c4cb8a2be48f9e7de56c"' +
        'data-macro-name="slide"><p>Content of slide</p></div><p />';
        content.getCheerioBody = () => mockBody;
        context.setHtmlBody(mockBody);
        addNewSlides(config, content)(context);
        expect(context.getHtmlBody().includes('Content of slide')).toBe(true);
    });

    it('Add new slides is using data-state as slide type', () => {
        const mockBody = '<div class="conf-macro output-block" data-hasbody="false" data-layout="default"' +
        'data-local-id="141105b0-1baf-44ce-9c96-27004ad82793" data-macro-id="00d0b33919f6759e73e5e7699a6238fc"' +
        'data-macro-name="slideSettings"></div><div class="conf-macro output-block" data-hasbody="true"' +
        'data-layout="default" data-local-id="08712a20-759f-474f-ad92-b7367ec870de" data-macro-id="e8dea08a24d1c4cb8a2be48f9e7de56c"' +
        'data-macro-name="slide"><p>Content of slide</p></div><p />';
        content.getCheerioBody = () => mockBody;
        context.setHtmlBody(mockBody);
        addNewSlides(config, content)(context);
        expect(context.getHtmlBody().includes('data-state="bubble"')).toBe(true);
    });

    it('Add new slides have a correct mapping between body and storage', () => {
        const mockBody = '<div class="conf-macro output-block" data-hasbody="false" data-layout="default"' +
        'data-local-id="141105b0-1baf-44ce-9c96-27004ad82793" data-macro-id="00d0b33919f6759e73e5e7699a6238fc"' +
        'data-macro-name="slideSettings"></div><div class="conf-macro output-block" data-hasbody="true"' +
        'data-layout="default" data-local-id="08712a20-759f-474f-ad92-b7367ec870de" data-macro-id="e8dea08a24d1c4cb8a2be48f9e7de56c"' +
        'data-macro-name="slide"><p>Content of slide</p></div><p />';
        content.getCheerioBody = () => mockBody;
        context.setHtmlBody(mockBody);
        addNewSlides(config, content)(context);
        expect(mockBody.includes('data-macro-id="e8dea08a24d1c4cb8a2be48f9e7de56c"'))
            .toBe(content.body.storage.value.includes('ac:local-id="141105b0-1baf-44ce-9c96-27004ad82793"'));
    });
});
