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
  theme: string;

  @IsOptional()
  @IsString()
  style: string;

  @IsOptional()
  @IsString()
  @IsIn(['blog', 'notitle', 'title'])
  type: string;

  @IsOptional()
  @IsString()
  @IsIn(['no-cache', 'clear-cache'])
  cache: string;
}
