import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumberString,
} from 'class-validator';

export default class PageParamsDTO {
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
  @IsNumberString()
    pageId: string;

  @ApiProperty({
    type: String,
    description: 'The version of the page to render.',
    example: '9',
  })
  @IsOptional()
  @IsNumberString()
    pageVersion: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Optional title of the page comes at the end of the URL.',
  })
  @IsOptional()
    pageSlug: string;

  // Optional parameters for the blog post router
  @IsOptional()
    year: string;

  @IsOptional()
    month: string;

  @IsOptional()
    day: string;
}
