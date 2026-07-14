import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

// Parse a #rgb / #rrggbb colour into [r, g, b]. Returns null for anything we
// cannot read confidently (named colours, rgb()/hsl(), gradients) so we never
// guess a text colour we can't verify.
const parseHexColour = (value: string): [number, number, number] | null => {
  const hex = value.trim().replace(/^#/, '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return null;
  }
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
};

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixTableBackground');
  const $ = context.getCheerioBody();

  $('.confluenceTh, .confluenceTd').each(
    (_macroIndex: number, headerElement: cheerio.Element) => {
      const hightlightColour = $(headerElement).attr('data-highlight-colour');
      if (hightlightColour) {
        $(headerElement).css('background-color', hightlightColour);

        // The author set this cell background explicitly, so the theme's text
        // colour may be unreadable on it (e.g. a white cell in the dark theme).
        // Pick a readable ink from the background's perceived brightness so the
        // content stays legible in any theme. Only explicitly-coloured cells
        // are touched; theme-default cells keep following the theme.
        const rgb = parseHexColour(hightlightColour);
        if (rgb) {
          const [r, g, b] = rgb;
          // Perceived brightness (ITU-R BT.601). >= 140 reads as a light
          // background that needs dark ink; below that, light ink.
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          $(headerElement).css('color', brightness >= 140 ? '#172b4d' : '#ffffff');
        }
      }
    },
  );

  context.getPerfMeasure('fixTableBackground');
};
