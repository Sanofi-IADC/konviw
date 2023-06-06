import { Module } from '@nestjs/common';
import { GoogleAnalyticsService } from './google-analytics.service';

@Module({
  imports: [],
  controllers: [],
  providers: [GoogleAnalyticsService],
  exports: [GoogleAnalyticsService],
})
export class GoogleAnalyticsModule {}
