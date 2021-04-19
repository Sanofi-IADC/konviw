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
    const proxyUrl = (this.config.get<Config>(
      'httpsProxy',
    ) as unknown) as string;
    let options = {};
    if (proxyUrl) {
      const host = proxyUrl.slice(0, proxyUrl.length - 5);
      const port = proxyUrl.slice(-4);
      options = { proxy: { host, port } };
    }
    return this.health.check([
      async () =>
        this.dns.pingCheck('Atlassian API', `${baseURL}`, { ...options }),
    ]);
  }
}
