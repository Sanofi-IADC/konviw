import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly app: AppService) {}

  @Get()
  // TODO: Replace this redirect with a custom error message
  // providing the URL of the Documentation to learn about using the proper routes and parameters
  // check https://docs.nestjs.com/exception-filters
  @Redirect('https://sanofi-iadc.github.io/konviw/')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  doNothing() {}
}
