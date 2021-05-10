import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumberString,
  IsIn,
} from 'class-validator';

export class PageParamsDTO {
  @IsNotEmpty()
  @IsString()
  spaceKey: string;

  @IsNotEmpty()
  @IsNumberString()
  pageId: string;

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
  @IsOptional()
  @IsString()
  // to select between 'light' and 'dark' mode
  theme: string;

  @IsOptional()
  @IsString()
  // to select the css stylesheet for the page or slides
  style = 'konviw';

  @IsOptional()
  @IsString()
  @IsIn(['blog', 'notitle', 'title'])
  type = 'title';

  @IsOptional()
  @IsString()
  @IsIn(['no-cache', 'clear-cache'])
  cache: string;
}
