import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt, IsNotEmpty, IsOptional, IsString,
} from 'class-validator';

export class PostsParamsDTO {
  @ApiProperty({
    type: String,
    description: 'The Confluence space key',
    example: 'konviw',
  })
  @IsNotEmpty()
  @IsString()
    spaceKey: string;
}

export class SearchQueryDTO {
  @ApiProperty({
    description: 'The Confluence space keys to search in separated by \'|\'.',
    example: 'konviw|iadc',
  })
  @IsNotEmpty()
  @IsString()
    spaceKey: string;

  @ApiPropertyOptional({
    required: false,
    description: 'The combination of words to search.',
    example: 'manifesto',
  })
  @IsOptional()
  @IsString()
    query: string;

  @ApiPropertyOptional({
    required: false,
    description: 'The type of page. Options are \'page\' or \'blogpage\'',
    example: 'blogpost',
  })
  @IsOptional()
  @IsString()
    type: string;

  @ApiPropertyOptional({
    required: false,
    description: 'The Confluence labels separated by \',\' which will be filtered as AND.',
    example: 'label1,label2',
  })
  @IsOptional()
  @IsString()
    labels: string;

  @ApiPropertyOptional({
    required: false,
    description: 'The maximum number of results to retrieve',
    example: '20',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
    maxResults: number;

  // This query param must encode all special characters, including: , / ? : @ & = + $ #
  // For instance using encodeURIComponent(meta.next)
  @ApiPropertyOptional({
    required: false,
    description: 'The URL path received by the API after a previous search to perform moves to the next or previous page of results.',
    example: ' ',
  })
  @IsOptional()
  @IsString()
    cursorResults: string;
}

export class SearchProjectsQueryDTO {
  @ApiProperty({
    type: String,
    description: 'The Jira server to search in',
    example: 'System JIRA',
  })
  @IsNotEmpty()
  @IsString()
    server: string;

  @ApiProperty({
    description: 'The of words to search.',
    example: 'iadc',
  })
  @IsOptional()
  @IsString()
    search: string;

  @ApiProperty({
    type: Number,
    description: 'Starting record number used for pagination',
    example: 0,
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
    startAt: number;

  @ApiProperty({
    type: Number,
    description: 'Maximum number of records per page',
    example: 50,
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
    maxResults: number;

  @ApiProperty({
    type: Number,
    description: 'The ID of the project category to filter',
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
    description: 'The Jira server to search in',
    example: 'System JIRA',
  })
  @IsNotEmpty()
  @IsString()
    server: string;
}

export class GetSpacesParamsDTO {
  @ApiProperty({
    type: String,
    description: 'The type of spaces to retrieve',
    example: 'global',
  })
  @IsNotEmpty()
  @IsString()
    type: string;
}
export class GetSpacesQueryDTO {
  @ApiProperty({
    type: Number,
    description: 'Starting record number used for pagination',
    example: 0,
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
    startAt = 0;

  @ApiProperty({
    type: Number,
    description: 'Maximum number of records to retrieve',
    example: 50,
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
    maxResults = 50;

  @ApiProperty({
    type: Number,
    description: 'Retrieve expanded fields',
    example: '0 | 1',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
    getFields = 0;
}
