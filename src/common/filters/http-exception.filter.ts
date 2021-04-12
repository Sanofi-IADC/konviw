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
    const { statusCode, message, error } = JSON.parse(
      JSON.stringify(exception.getResponse()),
    );

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      docs: 'https://sanofi-iadc.github.io/konviw/',
    });
  }
}
