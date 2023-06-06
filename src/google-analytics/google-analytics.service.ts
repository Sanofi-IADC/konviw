import {
  Logger,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GetGoogleAnalyticsReport, GoogleAnalyticsReportParams } from './types/getGoogleAnalyticsReport.type';

@Injectable()
export class GoogleAnalyticsService {
  private readonly logger = new Logger(GoogleAnalyticsService.name);

  private googleAnalyticsClient: BetaAnalyticsDataClient | undefined;

  constructor(private readonly config: ConfigService) {
    this.googleAnalyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        private_key: this.config.get('googleAnalytics.privateKey'),
        client_email: this.config.get('googleAnalytics.clientEmail'),
      },
    });
  }

  /**
    * @function getGoogleAnalyticsReport Service
    * @description Retrieve the google analytics report
    * @return Promise {GetGoogleAnalyticsReport} 'google-analytics' - google analytics report object
    * @param id {string}
    * @param params {GoogleAnalyticsReportParams}
    */
  async getGoogleAnalyticsReport(
    id: string,
    params: GoogleAnalyticsReportParams,
  ): Promise<GetGoogleAnalyticsReport> {
    try {
      const [response] = await this.googleAnalyticsClient.runReport({
        property: `properties/${id}`,
        ...params,
      });
      return response;
    } catch (err) {
      this.logger.log(err, 'error:getGoogleAnalyticsReport');
      throw new HttpException(`error:getGoogleAnalyticsReport > ${err}`, 404);
    }
  }
}
