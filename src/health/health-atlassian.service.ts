import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfluenceService } from '../confluence/confluence.service';

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
      await this.confluence.Search('konviw');
    } catch (error) {
      isHealthy = false;
    }
    console.log(isHealthy);
    let result;
    if (isHealthy) {
      result = this.getStatus('Atlassian API', isHealthy, { message: 'up' });
      console.log(result);
      this.logger.log(`Health Status is Up: ${JSON.stringify(result)}`);
      return result;
    }
    result = this.getStatus('Atlassian API', isHealthy, { message: 'down' });
    console.log(result);
    this.logger.log(`Health Status is Down: ${JSON.stringify(result)}`);

    throw new HealthCheckError('Atlassian API failed', result);
  }
}
