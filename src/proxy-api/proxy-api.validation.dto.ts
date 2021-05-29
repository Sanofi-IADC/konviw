import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
