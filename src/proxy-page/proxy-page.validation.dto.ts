import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumberString,
  IsIn,
} from 'class-validator';

export class PageParamsDTO {
  @ApiProperty({
    type: String,
    description: `The Confluence space key`,
    example: 'konviw',
  })
  @IsNotEmpty()
  @IsString()
  spaceKey: string;

  @ApiProperty({
    type: String,
    description: `The ID for the page to render.`,
    example: '98444',
  })
  @IsNotEmpty()
  @IsNumberString()
  pageId: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: `Optional title of the page comes at the end of the URL.`,
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

export class PageQueryDTO {
  @ApiPropertyOptional({
    type: String,
    required: false,
    description: `To select the theme between 'light' or 'dark'.`,
    example: 'dark',
  })
  @IsOptional()
  @IsString()
  // to select between 'light' and 'dark' mode
  theme: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: `To select the stylesheet for the page or slides to render. So far 'konviw' and 'iadc'.`,
    example: 'konviw',
  })
  @IsOptional()
  @IsString()
  // to select the css stylesheet for the page or slides
  style = 'konviw';

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: `Special layout for the page. Choose between 'log', 'notitle' or 'title'.`,
    example: 'title',
  })
  @IsOptional()
  @IsString()
  @IsIn(['blog', 'notitle', 'title'])
  type = 'title';

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: `Use 'no-cache' to get fresh data bypassing the NestJS cache`,
    example: 'no-cache',
  })
  @IsOptional()
  @IsString()
  @IsIn(['no-cache', 'clear-cache'])
  cache: string;
}
