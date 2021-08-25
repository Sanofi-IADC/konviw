import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

/**
 * ### Proxy page step to improve the visualization of the iframe macro with a maximize effect to the full size of the viewport
 *
 * @returns void
 */
export default (): Step => {
  return (context: ContextService): void => {
    context.setPerfMark('addFrameMaximize');
    const $ = context.getCheerioBody();

    // Processing the iframes in the page
    $('iframe').each((_index: number, elementFrame: cheerio.TagElement) => {
      const thisBlock = $(elementFrame).html();
      if (!thisBlock) {
        console.log('Bye');
        return;
      }
      $(elementFrame).addClass('iframe--responsive');
      $(elementFrame).wrap(`<div class="iframe--browser"></div>`);
      $(elementFrame).wrap(`<div class="iframe--browser_body"></div>`);
      $(elementFrame)
        .parent()
        .parent()
        .prepend(
          `<div id="iFrameWin" class="iframe--browser_bar">
            <div class="iframe--browser_bar_tabs"></div>
            <div class="iframe--browser_bar_btns">
              <div class="iframe--browser_bar_btn iframe--browser_bar_btn_resize"></div>
            </div>
          </div>`,
        );
    });

    // This example will have to be extended to handle the maximization effect by iframe ID
    $('body').append(
      `<script type="module">
      let maximizeBtn = document.querySelector('.iframe--browser_bar_btn_resize');

      let iframeBrowser = document.querySelector('.iframe--browser');

      maximizeBtn.addEventListener('click', (e) =>  {
        e.stopPropagation();
        iframeBrowser.classList.toggle('max')
      })

      iframeBrowser.addEventListener('click', (e) => {
        e.stopPropagation();
        if(iframeBrowser.classList.contains("mini")) {
          iframeBrowser.classList.remove('mini')
        }
      })
        </script>`,
    );

    // OR following a similar process that the one used for the expand-control component
    // const coll = document.getElementsByClassName("expand-control");
    //     let i;
    //     for (i = 0; i < coll.length; i++) {
    //       coll[i].addEventListener("click", function() {
    //         this.classList.toggle("active");
    //         var content = this.nextElementSibling;
    //         if (content.style.maxHeight){
    //           content.style.maxHeight = null;
    //         } else {
    //           content.style.maxHeight = content.scrollHeight + "px";
    //         }
    //       });
    //     }

    context.getPerfMeasure('addFrameMaximize');
  };
};
