import { google } from '@google-analytics/data/build/protos/protos';

export type GetGoogleAnalyticsReport = google.analytics.data.v1beta.IRunReportResponse;

export type GoogleAnalyticsReportParams = google.analytics.data.v1beta.IRunReportRequest;

export type GoogleAnalyticsReportMetrics = google.analytics.data.v1beta.IMetric[];

export type GoogleAnalyticsReportDimensions = google.analytics.data.v1beta.IDimension[];
