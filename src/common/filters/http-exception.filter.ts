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
            '  <title>Konviw - Page not found</title>\n' +
            `  <link rel="stylesheet" type="text/css" href="${basePath}/css/404.css?cache=${version}">\n` +
            '</head>\n' +
            '<body>\n' +
            '  <section class="page_404">\n' +
            '        <div>\n' +
            '          <div class="center">\n' +
            '            <div class="four_zero_four_bg">\n' +
            '              <h1>404</h1>\n' +
            '            </div>\n' +
            '            <div class="contant_box_404">\n' +
            '              <h3 class="h2">Look like you are lost</h3>\n' +
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
