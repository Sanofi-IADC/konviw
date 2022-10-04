import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt, IsNotEmpty, IsOptional,
} from 'class-validator';

export default class GetSpacesQueryDTO {
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
