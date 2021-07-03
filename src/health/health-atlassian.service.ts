import { Injectable, Logger } from '@nestjs/common';
import { ConfluenceService } from '../confluence/confluence.service';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';

@Injectable()
export class ApiHealthService extends HealthIndicator {
  private readonly logger = new Logger(ApiHealthService.name);
  constructor(private confluence: ConfluenceService) {
    super();
  }

  /**
   * @function apiCheck Service
   * @description Call the API service from Atlassian to check it is alive
   * @return Promise {HealthIndicatorResult}
   */
  async apiCheck(): Promise<HealthIndicatorResult> {
    let isHealthy = true;
    try {
      await this.confluence.getAllPosts('konviw');
    } catch (error) {
      isHealthy = false;
    }
    let result;
    if (isHealthy) {
      result = this.getStatus('Atlassian API', isHealthy, { message: 'up' });
      this.logger.log(`Health Status is Up: ${JSON.stringify(result)}`);
      return result;
    } else {
      result = this.getStatus('Atlassian API', isHealthy, { message: 'down' });
      this.logger.log(`Health Status is Down: ${JSON.stringify(result)}`);
    }
    throw new HealthCheckError('Atlassian API failed', result);
  }
}
