import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  @Get()
  @HealthCheck()
  check() {
    // return this.health.check([
    //   async () => this.dns.pingCheck('Atlassian API', `${baseURL}`),
    // ]);

    return {
      status: 'ok',
      info: { Konviw: { status: 'up' } },
      error: {},
      details: { Konviw: { status: 'up' } },
    };
  }
}
