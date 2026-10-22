import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfluenceService } from '../confluence/confluence.service';

// A successful check is reused for this long, so frequent probes
// (several workers and load balancer nodes) don't each hit Atlassian
const CACHE_TTL_MS = 60_000;
// Kept below the usual load balancer health check timeout (10s)
const CHECK_TIMEOUT_MS = 8_000;
// A timeout is tolerated (not reported as down) if the last success is this recent
const STALE_TOLERANCE_MS = 5 * 60_000;

@Injectable()
export class ApiHealthService extends HealthIndicator {
  private readonly logger = new Logger(ApiHealthService.name);

  private lastSuccess = 0;

  private inFlight: Promise<'ok' | 'timeout' | 'error'> | null = null;

  constructor(private confluence: ConfluenceService) {
    super();
  }

  /**
   * Runs one Atlassian search, shared by every concurrent caller. A search that
   * finishes after the timeout still refreshes lastSuccess for the next probe.
   */
  private runCheck(): Promise<'ok' | 'timeout' | 'error'> {
    if (this.inFlight) {
      return this.inFlight;
    }
    let timer: NodeJS.Timeout;
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), CHECK_TIMEOUT_MS);
    });
    const search = this.confluence
      .Search('konviw', undefined, undefined, undefined, 1)
      .then(() => {
        this.lastSuccess = Date.now();
        return 'ok' as const;
      })
      .catch(() => 'error' as const);
    // released when the check settles or times out, so a hung search can't block later probes
    const shared: Promise<'ok' | 'timeout' | 'error'> = Promise.race([search, timeout]).finally(() => {
      clearTimeout(timer);
      if (this.inFlight === shared) {
        this.inFlight = null;
      }
    });
    this.inFlight = shared;
    return shared;
  }

  /**
   * @function apiCheck Service
   * @description Call the API service from Atlassian to check it is alive
   * @return Promise {HealthIndicatorResult}
   */
  async apiCheck(): Promise<HealthIndicatorResult> {
    const now = Date.now();
    if (now - this.lastSuccess < CACHE_TTL_MS) {
      return this.getStatus('Atlassian API', true, { message: 'up' });
    }

    let isHealthy = true;
    const outcome = await this.runCheck();

    if (outcome === 'timeout' && Date.now() - this.lastSuccess < STALE_TOLERANCE_MS) {
      this.logger.warn(
        `Atlassian API slow (>${CHECK_TIMEOUT_MS}ms), reporting up from recent success`,
      );
    } else if (outcome !== 'ok') {
      isHealthy = false;
    }

    let result;
    if (isHealthy) {
      result = this.getStatus('Atlassian API', isHealthy, { message: 'up' });
      this.logger.log(`Health Status is Up: ${JSON.stringify(result)}`);
      return result;
    }
    result = this.getStatus('Atlassian API', isHealthy, { message: 'down' });
    this.logger.log(`Health Status is Down (${outcome}): ${JSON.stringify(result)}`);

    throw new HealthCheckError('Atlassian API failed', result);
  }
}
