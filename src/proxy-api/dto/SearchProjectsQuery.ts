import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt, IsNotEmpty, IsOptional, IsString,
} from 'class-validator';

export default class SearchProjectsQueryDTO {
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
