import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export default class CustomHttpCacheInterceptor extends CacheInterceptor {
  private readonly logger = new Logger(CustomHttpCacheInterceptor.name);

  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const isGetRequest = request.method === 'GET';
    const key = request.url;

    if (!isGetRequest || request.query.cache === 'no-cache' || request.query.status === 'draft') {
      return undefined;
    }
    if (request.query.cache === 'clear-cache') {
      this.cacheManager.clear?.().catch((err) => this.logger.warn('Failed to clear cache', err));
    }
    return key;
  }
}
