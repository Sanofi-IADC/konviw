import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Config from '../config/config.d';

@Controller('health')
export class HealthController {
  constructor(
    private config: ConfigService,
    private health: HealthCheckService,
    private dns: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const baseURL = this.config.get<Config>('confluence.baseURL');
    return this.health.check([
      async () => this.dns.pingCheck('Atlassian API', `${baseURL}`),
    ]);
  }
}
