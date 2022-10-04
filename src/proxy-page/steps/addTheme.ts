import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('addDarkTheme');
  const $ = context.getCheerioBody();

  const theme = context.getTheme();

  switch (theme) {
    case 'dark':
    case 'light':
      // When the DOM content is loaded set the theme and save the preference
      $('body').append(
        `<script type="module">
            document.addEventListener('DOMContentLoaded', function () {
              document.documentElement.setAttribute('data-theme', '${theme}');
              localStorage.setItem('theme', '${theme}');
            })
          </script>`,
      );
      break;
    default:
      $('body').append(
        `<script type="module">
            document.addEventListener('DOMContentLoaded', function () {
              const currentTheme = localStorage.getItem('theme');
              if (currentTheme) {
                document.documentElement.setAttribute('data-theme', currentTheme);
              } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
              }
            })
          </script>`,
      );
  }

  context.getPerfMeasure('addDarkTheme');
};
