import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message;
    const status = exception.getStatus();
    const error = exception.name;

    if (status === 404) {
      response
        .status(404)
        .send(
          '<!DOCTYPE html>\n' +
            "<html lang='en'>\n" +
            '<head>\n' +
            "  <meta charset='UTF-8'>\n" +
            '  <title>Konviw - Page not found</title>\n' +
            '</head>\n' +
            '<body>\n' +
            '  <h1>Page not found 😞</h1>\n' +
            "  docs: <a href='https://sanofi-iadc.github.io/konviw/'>https://sanofi-iadc.github.io/konviw/</a>\n" +
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
