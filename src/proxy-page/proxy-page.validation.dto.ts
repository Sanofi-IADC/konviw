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
  @IsIn(['light', 'dark'])
  theme: string;

  @IsOptional()
  @IsString()
  @IsIn(['blog', 'notitle'])
  type: string;

  @IsOptional()
  @IsString()
  @IsIn(['no-cache', 'clear-cache'])
  cache: string;
}
