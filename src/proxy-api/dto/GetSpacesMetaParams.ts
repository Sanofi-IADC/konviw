import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export default class GetSpacesMetaParamsDTO {
  @ApiProperty({
    type: String,
    description: 'The type of spaces to retrieve',
    example: 'global',
  })
  @IsNotEmpty()
  @IsString()
    type: string;
}
