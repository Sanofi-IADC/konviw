import { IsNotEmpty, IsString } from 'class-validator';

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
}
