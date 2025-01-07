import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export default class GetCustomContentsInSpaceQueryDTO {
  @ApiProperty({
    type: String,
    description: 'The type of custom content to retrieve',
    example: 'forge:42bc20e9-123e-4153-bcd1-02a43d44cc6e:847c9fab-7106-4bde-b688-25e9cd330117:custom-content-sanofi-forge-official-exports',
  })
  @IsNotEmpty()
  @IsString()
    type: string;

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
