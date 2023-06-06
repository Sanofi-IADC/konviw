import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString,
} from 'class-validator';

export default class GetGoogleAnalyticsReportParamsDTO {
  @ApiProperty({
    type: String,
    description: 'Google Analytics property id',
    example: '123',
  })
  @IsNotEmpty()
  @IsString()
    id: string;
}
