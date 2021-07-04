import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly config: ConfigService) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message;
    const status = exception.getStatus();
    const error = exception.name;

    const version = this.config.get('version');
    const basePath = this.config.get('web.basePath');

    if (status === 404) {
      response
        .status(404)
        .send(
          '<!DOCTYPE html>\n' +
            '<html lang="en">\n' +
            '<head>\n' +
            '  <meta charset="UTF-8">\n' +
            '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
            '  <title>konviw - Page not found</title>\n' +
            `  <link rel="stylesheet" type="text/css" href="${basePath}/css/http-codes.css?cache=${version}">\n` +
            '</head>\n' +
            '<body>\n' +
            '  <section class="page_404">\n' +
            '        <div>\n' +
            '          <div class="center">\n' +
            '            <div class="page_404_bg">\n' +
            '              <h1>404</h1>\n' +
            '            </div>\n' +
            '            <div class="page_404_content">\n' +
            '              <h3>Look like you are lost</h3>\n' +
            "              <p>I'm afraid you've found a page that doesn't exist. Sorry about that.</p>\n" +
            '              <p>That can happen when you follow a link to something that has since been deleted.<br>Or the link was incorrect to begin with.</p>\n' +
            '              <p>If you wish, paste a Page ID from your Confluence instance and we will bring you there <br>or read the <a href="https://sanofi-iadc.github.io/konviw/">konviw documentation</a>.\n' +
            '              <p><input type="text" id="pageID" class="pageID-input" size="15" placeholder="Type a Page ID">\n' +
            '              <button type="button" onclick="goToPage();" class="goToPage-btn">Go to Page</button>\n' +
            '              </p>\n' +
            '            </div>\n' +
            '          </div>\n' +
            '        </div>\n' +
            '  </section>\n' +
            '<script type="text/javascript">\n' +
            '  function goToPage(){\n' +
            '    const pageId = document.getElementById("pageID").value;\n' +
            '    console.log(pageId);\n' +
            `    window.location.href = "${basePath}/wiki/spaces/konviw/pages/" + pageId;\n` +
            '  }\n' +
            '</script>\n' +
            '</body>\n' +
            '</html>',
        );
    } else if (status === 403) {
      response
        .status(403)
        .send(
          '<!DOCTYPE html>\n' +
            '<html lang="en">\n' +
            '<head>\n' +
            '  <meta charset="UTF-8">\n' +
            '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
            '  <title>konviw - Access Forbidden</title>\n' +
            `  <link rel="stylesheet" type="text/css" href="${basePath}/css/http-codes.css?cache=${version}">\n` +
            '</head>\n' +
            '<body>\n' +
            '<use><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve" class="whistle">\n' +
            '<metadata> Svg Vector Icons : http://www.onlinewebfonts.com/icon </metadata>\n' +
            '<g><g transform="translate(0.000000,511.000000) scale(0.100000,-0.100000)">\n' +
            '<path d="M4295.8,3963.2c-113-57.4-122.5-107.2-116.8-622.3l5.7-461.4l63.2-55.5c72.8-65.1,178.1-74.7,250.8-24.9c86.2,61.3,97.6,128.3,97.6,584c0,474.8-11.5,526.5-124.5,580.1C4393.4,4001.5,4372.4,4001.5,4295.8,3963.2z"/><path d="M3053.1,3134.2c-68.9-42.1-111-143.6-93.8-216.4c7.7-26.8,216.4-250.8,476.8-509.3c417.4-417.4,469.1-463.4,526.5-463.4c128.3,0,212.5,88.1,212.5,224c0,67-26.8,97.6-434.6,509.3c-241.2,241.2-459.5,449.9-488.2,465.3C3181.4,3180.1,3124,3178.2,3053.1,3134.2z"/><path d="M2653,1529.7C1644,1445.4,765.1,850,345.8-32.7C62.4-628.2,22.2-1317.4,234.8-1960.8C451.1-2621.3,947-3186.2,1584.6-3500.2c1018.6-501.6,2228.7-296.8,3040.5,515.1c317.8,317.8,561,723.7,670.1,1120.1c101.5,369.5,158.9,455.7,360,553.3c114.9,57.4,170.4,65.1,1487.7,229.8c752.5,93.8,1392,181.9,1420.7,193.4C8628.7-857.9,9900,1250.1,9900,1328.6c0,84.3-67,172.3-147.4,195.3c-51.7,15.3-790.8,19.1-2558,15.3l-2487.2-5.7l-55.5-63.2l-55.5-61.3v-344.6V719.8h-411.7h-411.7v325.5c0,509.3,11.5,499.7-616.5,494C2921,1537.3,2695.1,1533.5,2653,1529.7z"/></g></g>\n' +
            '</svg></use>\n' +
            '<h1 class="page_403">403</h1>\n' +
            '<h2 class="page_403">Not this time, access forbidden!</h2>\n' +
            '</body>\n' +
            '</html>',
        );
    } else {
      response.status(status).json({
        status,
        message,
        error,
        docs: 'https://sanofi-iadc.github.io/konviw/',
      });
    }
  }
}
