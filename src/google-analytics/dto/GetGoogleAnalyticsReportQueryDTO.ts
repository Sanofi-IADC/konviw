import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty, IsOptional, IsString,
} from 'class-validator';
import {
  GoogleAnalyticsReportMetrics,
  GoogleAnalyticsReportDimensions,
  GoogleAnalyticsReportDimensionsFilter,
} from '../types/getGoogleAnalyticsReport.type';

export default class GetGoogleAnalyticsReportQueryDTO {
  @ApiProperty({
    type: String,
    description: 'The start date',
    example: '2023-05-02',
  })
  @IsNotEmpty()
  @IsString()
    startDate: string;

  @ApiProperty({
    type: String,
    description: 'The end date',
    example: '2023-05-02',
  })
  @IsNotEmpty()
  @IsString()
    endDate: string;

  @ApiProperty({
    type: [String],
    description: 'The metric specification',
    example: 'activeUsers',
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.split(',').map((metric: string) => ({ name: metric })))
    metrics: GoogleAnalyticsReportMetrics;

  @ApiProperty({
    type: [String],
    description: 'The dimensions specification',
    example: 'date',
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.split(',').map((dimension: string) => ({ name: dimension })))
    dimensions: GoogleAnalyticsReportDimensions;

  @ApiProperty({
    type: Object,
    description: 'The dimensions filter specification',
    example: '{"filter":{"fieldName":"hostName","stringFilter":{"matchType":"CONTAINS","value":"VALUE"}}}',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? JSON.parse(value) : ''))
    dimensionFilter: GoogleAnalyticsReportDimensionsFilter;
}
