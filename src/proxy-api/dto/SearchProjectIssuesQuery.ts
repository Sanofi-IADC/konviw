import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt, IsNotEmpty, IsOptional, IsString,
} from 'class-validator';

export default class SearchProjectIssuesQueryDTO {
  @ApiProperty({
    type: String,
    description: 'The Jira server to search in',
    example: 'System JIRA',
  })
  @IsNotEmpty()
  @IsString()
    server: string;

  @ApiProperty({
    description: 'The JQL to search.',
    example: 'project = FND ORDER BY resolution DESC',
  })
  @IsOptional()
  @IsString()
    jqlSearch: string;

  @ApiProperty({
    description: 'A list of fields to return for each issue, use it to retrieve a subset of fields',
    example: 'fields=field1,field2&fields=field3.',
  })
  @IsOptional()
  @IsString()
    fields: string;

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
    type: Boolean,
    description: 'To set reader access - true or false ',
    example: true,
  })
  @IsOptional()
  @IsString()
    reader: boolean;
}
