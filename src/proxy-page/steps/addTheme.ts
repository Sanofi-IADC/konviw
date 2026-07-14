import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addDarkTheme');
  const $ = context.getCheerioBody();

  const theme = context.getTheme();

  switch (theme) {
    case 'dark':
    case 'light':
      // The theme is known server-side, so render it straight onto <html>. The
      // attribute is present at parse time, CSS matches on first paint and there
      // is no light->dark flash. A tiny synchronous script only persists the
      // preference for later param-less loads (no DOMContentLoaded / no defer).
      $('html').attr('data-theme', theme);
      $('head').prepend(
        `<script>try{localStorage.setItem('theme','${theme}')}catch(e){}</script>`,
      );
      break;
    default:
      // No theme param: we cannot know the stored preference server-side, so run
      // a blocking inline script as the first <head> node. It sets data-theme
      // synchronously, before the stylesheet paints the body -> no flash.
      $('head').prepend(
        `<script>
          (function () {
            var theme = null;
            try { theme = localStorage.getItem('theme'); } catch (e) { theme = null; }
            if (!theme) {
              theme = 'light';
              try { localStorage.setItem('theme', 'light'); } catch (e) { /* ignore */ }
            }
            document.documentElement.setAttribute('data-theme', theme);
          })();
        </script>`,
      );
  }

  context.getPerfMeasure('addDarkTheme');
};
