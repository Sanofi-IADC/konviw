import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString,
} from 'class-validator';

export default class GetCustomContentByIdParamsDTO {
  @ApiProperty({
    type: Number,
    description: 'The Id of custom content to retrieve',
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
    id: number;
}
