import { Controller, Get, Render } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private config: ConfigService) {}

  @Get()
  @Render('index')
  root() {
    const version = this.config.get('version');
    const basePath = this.config.get('web.basePath');
    return { basePath, version };
  }
}
