import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { ApiHealthService } from './health-atlassian.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly apiHealth: ApiHealthService,
    private readonly health: HealthCheckService,
  ) {}

  /**
   * @GET (controller)
   * @description Health check controller to show Konviw and Atlassian API status
   * @return {JSON} '{"status": "ok"}' - terminus JSON response
   */
  @ApiOkResponse({
    description:
      'Health check controller to show Konviw and Atlassian API status.',
  })
  @Get()
  @HealthCheck()
  apiCheck() {
    return this.health.check([async () => this.apiHealth.apiCheck()]);
  }
}
