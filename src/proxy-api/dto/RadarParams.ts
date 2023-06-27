import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export default class RadarParamsDTO {
  @ApiProperty({
    type: String,
    description: 'The Confluence space key',
    example: 'konviw',
  })
  @IsNotEmpty()
  @IsString()
    spaceKey: string;

  @ApiProperty({
    type: String,
    description: 'The ID for the page to render.',
    example: '98444',
  })
  @IsNotEmpty()
  @IsString()
    pageId: string;

  @ApiProperty({
    type: String,
    description: 'The period for the technology radar assessment',
    example: '2023-S1',
  })
  @IsNotEmpty()
  @IsString()
    period: string;

  @ApiProperty({
    type: String,
    description: 'The extension',
    example: '.json',
  })
  @IsNotEmpty()
  @IsString()
    ext: string;
}
