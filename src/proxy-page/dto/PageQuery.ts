import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';

export default class PageQueryDTO {
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
    description:
      'Special layout for the page. Choose between \'log\', \'notitle\', \'title\', \'title,author\' or \'title,author,version\'.',
    example: 'title',
  })
  @IsOptional()
  @IsString()
  @IsIn(['blog', 'notitle', 'title', 'title,author', 'title,author,version'])
    type = 'title,author';

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'We have two modes: \'fullpage\' and \'iframe-resizer\'. \'iframe-resizer\' will disable scroll to top, zoom effect in images, reading progress bar and floating toc menu.', // eslint-disable-line max-len
    example: 'iframe-resizer',
  })
  @IsOptional()
  @IsString()
  @IsIn(['fullpage', 'iframe-resizer', 'debug'])
  // to select default view for pages
    view = 'fullpage';

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
