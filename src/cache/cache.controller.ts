import { CACHE_MANAGER, Controller, Delete, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Controller('cache')
export class CacheController {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @Delete()
  clearCache(): Promise<void> {
    return this.cacheManager.reset();
  }
}
