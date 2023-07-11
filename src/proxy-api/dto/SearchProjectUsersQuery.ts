import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty, IsOptional, IsString,
} from 'class-validator';

export default class SearchProjectUsersQueryDTO {
  @ApiProperty({
    type: String,
    description: 'The query to search with',
    example: 'is assignee of (PROJ-1, PROJ-2)',
  })
  @IsNotEmpty()
  @IsString()
    query: string;

  @ApiProperty({
    type: Number,
    description: 'Starting record number used for pagination',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
    startAt: number;

  @ApiProperty({
    type: Number,
    description: 'Maximum number of records per page',
    example: 50,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
    maxResults: number;
}
