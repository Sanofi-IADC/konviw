import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Logs and monitors incoming query parameters.
 * - Logs all query params in debug mode
 * - Logs unexpected/unknown query params in debug mode
 */
@Injectable()
export class QueryParamsLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(QueryParamsLoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const rawQueryParams = request.query;

    if (!rawQueryParams || Object.keys(rawQueryParams).length === 0) {
      return next.handle();
    }

    const { path } = request;
    const params = Object.keys(rawQueryParams);

    this.logger.debug(
      `[${request.method}] ${path} - Query params: ${params.join(', ')}`,
    );

    const knownIgnoredParams = new Set([
      'atlOrigin',
    ]);

    const unexpectedParams = params.filter((p) => !knownIgnoredParams.has(p));

    if (unexpectedParams.length > 0) {
      this.logger.debug(
        `Unexpected query parameters on ${path}: ${unexpectedParams.join(', ')}`,
      );
    }

    return next.handle();
  }
}
