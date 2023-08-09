import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../../src/context/context.service';
import { createModuleRefForStep } from './utils';
import { confluenceMockServiceFactory } from '../mocks/confluenceService';
import fixEmojis from '../../../src/proxy-page/steps/fixEmojis';

describe('ConfluenceProxy / fixEmojis', () => {
  let context: ContextService;
  let config: ConfigService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    config = moduleRef.get<ConfigService>(ConfigService);
    context.initPageContext('v2', 'XXX', '123456', 'dark');
  });

  it('Emojis inserted in headings are displaying correctly', async () => {
    const mockBody = '<h2 id="konviw-demotitlewithspecialemoji-Timeline">\\uD83D\\uDDD3 Timeline</h2>';
    const step = fixEmojis(config, confluenceMockServiceFactory);
    context.setHtmlBody(mockBody);
    await step(context);
    expect(context.getHtmlBody().includes('\\uD83D\\uDDD3')).toBe(false);
  });

  it('Regular emojis are displaying correctly', async () => {
    const mockBody = '<h2 id="konviw-demotitlewithspecialemoji-Scope">🎯 Scope</h2>';
    const step = fixEmojis(config, confluenceMockServiceFactory);
    context.setHtmlBody(mockBody);
    await step(context);
    expect(context.getHtmlBody().includes('🎯')).toBe(true);
  });

  it('Regular emojis are displaying correctly', async () => {
    const mockBody = '<h2 id="konviw-demotitlewithspecialemoji-Scope">🎯 Scope</h2>';
    const step = fixEmojis(config, confluenceMockServiceFactory)
    context.setHtmlBody(mockBody);
    await step(context);
    expect(context.getHtmlBody().includes('🎯')).toBe(true);
  });

  it('Custom emojis are removed', async () => {
    const mockBody = '<img class="emoticon emoticon-blue-star" data-emoji-id="873dd2a0-8bde-4bf3-900e-1bc9e97d4082" data-emoji-shortname=":BatchGenealogyCurrentBatch:" data-emoji-fallback=":BatchGenealogyCurrentBatch:" src="/wiki/s/-887266990/6452/8344287c2031a93f66f820b9b0f19202a5077222/_/images/icons/emoticons/star_blue.png" width="16" height="16" data-emoticon-name="blue-star" alt="(blue star)" />';
    const step = fixEmojis(config, confluenceMockServiceFactory)
    context.setHtmlBody(mockBody);
    await step(context);
    expect(context.getHtmlBody().includes(':BatchGenealogyCurrentBatch:')).toBe(false);
  });
});
