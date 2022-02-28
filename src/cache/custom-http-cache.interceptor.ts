import { CacheInterceptor, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export default class CustomHttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const isGetRequest = request.method === 'GET';
    const key = request.url;
    console.log(key);

    if (!isGetRequest || request.query.cache === 'no-cache') {
      return undefined;
    }
    if (request.query.cache === 'clear-cache') {
      this.cacheManager.reset();
    }
    return key;
  }
}
