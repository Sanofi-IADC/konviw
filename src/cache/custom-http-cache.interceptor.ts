import { CacheInterceptor, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export default class CustomHttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const isGetRequest = request.method === 'GET';
    const requestURl = request.path;

    if (!isGetRequest || request.query.cache === 'no-cache') {
      return undefined;
    }
    return requestURl;
  }
}
