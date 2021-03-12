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

  @IsOptional()
  pageSlug: string;

  @IsNotEmpty()
  @IsNumberString()
  pageId: string;
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
}
