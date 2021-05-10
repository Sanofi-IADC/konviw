import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PostsParamsDTO {
  @IsNotEmpty()
  @IsString()
  spaceKey: string;
}

export class SearchQueryDTO {
  @IsNotEmpty()
  @IsString()
  spaceKey: string;

  @IsNotEmpty()
  @IsString()
  query: string;

  @IsOptional()
  maxResults: number;

  // This query param must encode all special characters, including: , / ? : @ & = + $ #
  // For instance using encodeURIComponent()
  @IsOptional()
  cursorResults: string;
}
