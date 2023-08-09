import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import fixCaptionImage from '../../../src/proxy-page/steps/fixCaptionImage';
import { createModuleRefForStep } from './utils';

describe('ConfluenceProxy / fixCaptionImage', () => {
    let context: ContextService;
    let config: ConfigService;

    beforeEach(async () => {
        const moduleRef = await createModuleRefForStep();
        context = moduleRef.get<ContextService>(ContextService);
        context.setBodyStorage('<ac:image ac:align="center" ac:layout="center" ac:original-height="512" ac:original-width="512"><ri:attachment ri:filename="unnamed (1).png" ri:version-at-save="1" /><ac:caption><p>exampleCaption</p></ac:caption></ac:image><p />');
        config = moduleRef.get<ConfigService>(ConfigService);
        context.initPageContext('v2', 'XXX', '123456', 'dark');
    });

    it('FixCaptionImage should create caption', () => {
        const mockBody = '<span class="confluence-embedded-file-wrapper image-center-wrapper"><img class="confluence-embedded-image image-center" loading="lazy" src="http://localhost:4000/cpv/wiki/download/attachments/64024054246/unnamed%20(1).png?version=1&amp;modificationDate=1680164613913&amp;cacheVersion=1&amp;api=v2" data-image-src="https://sanofi.atlassian.net/wiki/download/attachments/64024054246/unnamed%20(1).png?version=1&amp;modificationDate=1680164613913&amp;cacheVersion=1&amp;api=v2" data-height="512" data-width="512" data-unresolved-comment-count="0" data-linked-resource-id="64030409395" data-linked-resource-version="1" data-linked-resource-type="attachment" data-linked-resource-default-alias="unnamed (1).png" data-base-url="https://sanofi.atlassian.net/wiki" data-linked-resource-content-type="image/png" data-linked-resource-container-id="64024054246" data-linked-resource-container-version="3" data-media-id="2e93e007-c7d0-4f79-a397-a2b14158b4ff" data-media-type="file" width="512"></span>';
        context.setHtmlBody(mockBody);
        fixCaptionImage()(context);
        expect(context.getHtmlBody().includes('<p class="image-caption">exampleCaption</p>')).toBe(true);
    });
});
