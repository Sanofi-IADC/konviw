import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt, IsNotEmpty, IsOptional, IsString,
} from 'class-validator';

export default class SearchQueryDTO {
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
