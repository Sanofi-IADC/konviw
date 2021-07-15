import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PostsParamsDTO {
  @ApiProperty({
    type: String,
    description: `The Confluence space key`,
    example: 'konviw',
  })
  @IsNotEmpty()
  @IsString()
  spaceKey: string;
}

export class SearchQueryDTO {
  @ApiProperty({
    description: `The Confluence space keys to search in separated by '|'.`,
    example: 'konviw|iadc',
  })
  @IsNotEmpty()
  @IsString()
  spaceKey: string;

  @ApiProperty({
    description: `The combination of words to search.`,
    example: 'styles',
  })
  @IsNotEmpty()
  @IsString()
  query: string;

  @ApiPropertyOptional({
    required: false,
    description: `The combination of words to search.`,
    example: '2',
  })
  @IsOptional()
  maxResults: number;

  // This query param must encode all special characters, including: , / ? : @ & = + $ #
  // For instance using encodeURIComponent()
  @ApiPropertyOptional({
    required: false,
    description: `The URL path received by the API after a previous search to perform moves to the next or previous page of results.`,
    example: ' ',
  })
  @IsOptional()
  cursorResults: string;
}

export class SearchProjectsQueryDTO {
  @ApiProperty({
    type: String,
    description: `The Jira server to search in`,
    example: 'System JIRA',
  })
  @IsNotEmpty()
  @IsString()
  server: string;

  @ApiProperty({
    description: `The of words to search.`,
    example: 'iadc',
  })
  @IsOptional()
  @IsString()
  search: string;

  @ApiProperty({
    type: Number,
    description: `Starting record number used for pagination`,
    example: 0,
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  startAt: number;

  @ApiProperty({
    type: Number,
    description: `Maximum number of records per page`,
    example: 50,
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  maxResults: number;

  @ApiProperty({
    type: Number,
    description: `The ID of the project category to filter`,
    example: 10006,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId: number;
}

export class SearchProjectCategoriesQueryDTO {
  @ApiProperty({
    type: String,
    description: `The Jira server to search in`,
    example: 'System JIRA',
  })
  @IsNotEmpty()
  @IsString()
  server: string;
}
