import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import * as cheerio from 'cheerio';

export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addCopyLinks');
    const $ = context.getCheerioBody();
    $('body').append(`
      <script lang='js'>
        // Copy to clipboard function
        function copyToClipboard(text) {
          const url = window.location.href.match(/(^[^#]*)/)[0] + '#'+ text;
          const inputc = document.body.appendChild(document.createElement("input"));
          inputc.value = url;
          inputc.focus();
          inputc.select();
          document.execCommand('copy');
          inputc.parentNode.removeChild(inputc);
        }
        document.querySelectorAll('.🔗 button').forEach(button => {
          button.addEventListener('click', () => {
            button.classList.add('visited');
          });
          button.addEventListener('mouseleave', () => {
            button.classList.remove('visited')
          })
        })
      </script>`);
    // Add the link button next to the headings
    $('h1:not(.titlePage),h2,h3,h4,h5,h6').each(
      (_index: number, elementHeading: cheerio.Element) => {
        $(elementHeading).append(
          `<span role="presentation" class="🔗">
            <button onclick="copyToClipboard('${elementHeading.attribs.id}')">
                <svg width="24" height="24" viewBox="0 0 24 24"><g fill="currentColor" fill-rule="evenodd"><path d="M12.856 5.457l-.937.92a1.002 1.002 0 000 1.437 1.047 1.047 0 001.463 0l.984-.966c.967-.95 2.542-1.135 3.602-.288a2.54 2.54 0 01.203 3.81l-2.903 2.852a2.646 2.646 0 01-3.696 0l-1.11-1.09L9 13.57l1.108 1.089c1.822 1.788 4.802 1.788 6.622 0l2.905-2.852a4.558 4.558 0 00-.357-6.82c-1.893-1.517-4.695-1.226-6.422.47"></path><path d="M11.144 19.543l.937-.92a1.002 1.002 0 000-1.437 1.047 1.047 0 00-1.462 0l-.985.966c-.967.95-2.542 1.135-3.602.288a2.54 2.54 0 01-.203-3.81l2.903-2.852a2.646 2.646 0 013.696 0l1.11 1.09L15 11.43l-1.108-1.089c-1.822-1.788-4.802-1.788-6.622 0l-2.905 2.852a4.558 4.558 0 00.357 6.82c1.893 1.517 4.695 1.226 6.422-.47"></path></g></svg>
            </button>
        </span>`,
        );
      },
    );
    context.getPerfMeasure('addCopyLinks');
  };
};
