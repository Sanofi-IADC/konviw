import { ConfigService } from '@nestjs/config';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

/**
 * ### Proxy page step to add Web statistics trackers for Matomo or Google.
 *
 * This module gets Cheerio to append to the head of the page the web tracker for Matomo or Google Analytics. Env variables must be defined:
 *
 * - `matomoBaseURL` and `matomoIdSite` for Matomo
 * - `googleTag` for Google Analytics
 *
 * @param  {ConfigService} config
 * @returns void
 */
export default (config: ConfigService): Step => (context: ContextService): void => {
  context.setPerfMark('addWebStatsTracker');
  const $ = context.getCheerioBody();
  const matomoBaseURL = config.get('matomo.baseURL');
  const matomoIdSite = config.get('matomo.idSite');
  const googleTag = config.get('google.tag');

  if (matomoBaseURL && matomoIdSite) {
    $('head').append(
      `<!-- Matomo -->
      <script type="text/javascript">
        var _paq = window._paq || [];
        /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function() {
          var u="${matomoBaseURL}/";
          _paq.push(['setTrackerUrl', u+'matomo.php']);
          _paq.push(['setSiteId', '${matomoIdSite}']);
          var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
          g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
        })();
      </script>
      <!-- End Matomo Tracker -->`,
    );
  }

  if (googleTag) {
    $('head').append(
      `<!-- Google Tag Manager -->
      <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${googleTag}');</script>
      <!-- End Google Tag Manager -->`,
    );
    $('body').append(
      `<!-- Google Tag Manager (noscript) -->
      <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${googleTag}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
      <!-- End Google Tag Manager (noscript) -->`,
    );
  }

  context.getPerfMeasure('addWebStatsTracker');
};
