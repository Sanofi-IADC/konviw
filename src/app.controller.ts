import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly app: AppService) {}

  @Get()
  redirect(@Res() res: Response) {
    return res.redirect(303, this.app.getHealthCheck());
  }
}
