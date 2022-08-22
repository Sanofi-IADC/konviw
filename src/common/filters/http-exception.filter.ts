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
    const { message } = exception;
    const status = exception.getStatus();
    const error = exception.name;

    const version = this.config.get('version');
    const basePath = this.config.get('web.basePath');

    const INCOMING_MESSAGE_IDX = 0;
    const API_ENDPOINT = `${basePath}/api`;

    const incomingMsg = host.getArgByIndex(INCOMING_MESSAGE_IDX);
    const route = incomingMsg.path
      ? String(host.getArgByIndex(INCOMING_MESSAGE_IDX).path)
      : '';

    if (
      route.indexOf(API_ENDPOINT) == -1
      && (status === 404 || status === 400)
    ) {
      response.status(status).render(status.toString(), {
        basePath,
        version,
        error: status,
        message,
      });
    } else if (status === 403) {
      response
        .status(status)
        .render(status.toString(), { basePath, version });
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
