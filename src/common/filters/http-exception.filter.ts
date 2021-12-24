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

    const INCOMING_MESSAGE_IDX = 0;
    const WIKI_ENDPOINT = `${basePath}/wiki`;

    const route = String(
      host.getArgByIndex(INCOMING_MESSAGE_IDX)['route']['path'],
    );

    if (
      route.indexOf(WIKI_ENDPOINT) > -1 &&
      (status === 404 || status === 400)
    ) {
      response.status(status).render(status.toString(), {
        basePath: basePath,
        version: version,
        error: status,
        message: message,
      });
    } else if (status === 403) {
      response
        .status(status)
        .render(status.toString(), { basePath: basePath, version: version });
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
