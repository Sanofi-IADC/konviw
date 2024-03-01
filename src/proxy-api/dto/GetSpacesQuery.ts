import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export default class GetSpacesQueryDTO {
  @ApiProperty({
    type: Number,
    description: 'Maximum number of records to retrieve',
    example: 250,
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
    limit = 25;

  @ApiProperty({
    type: String,
    description: 'Starting cursor used for pagination',
    example: 'xyz',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
    next = '';
}
