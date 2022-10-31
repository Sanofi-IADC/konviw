import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';

export default class SlidesQueryDTO {
  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'To select the theme between \'light\' or \'dark\'.',
    example: 'dark',
  })
  @IsOptional()
  @IsString()
  // to select between 'light' and 'dark' mode
    theme: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'To select the stylesheet for the page or slides to render. So far \'konviw\' and \'iadc\'.',
    example: 'konviw',
  })
  @IsOptional()
  @IsString()
  // to select the css stylesheet for the page or slides
    style = 'konviw';

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Transition style. Choose between \'none\', \'fade\', \'slide\', \'convex\', \'concave\' or \'zoom\'.',
    example: 'slide',
  })
  @IsOptional()
  @IsString()
  @IsIn(['none', 'fade', 'slide', 'convex', 'concave', 'zoom'])
    transition = 'slide';

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Use \'no-cache\' to get fresh data bypassing the NestJS cache',
    example: 'no-cache',
  })
  @IsOptional()
  @IsString()
  @IsIn(['no-cache', 'clear-cache'])
    cache: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Use \'current\' or nothing for published pages and \'draft\' for pages in DRAFT not yet published',
    example: 'current',
  })
  @IsOptional()
  @IsString()
  @IsIn(['current', 'draft'])
    status: string;
}
