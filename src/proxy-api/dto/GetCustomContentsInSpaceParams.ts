import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString,
} from 'class-validator';

export default class GetCustomContentsInSpaceParamsDTO {
  @ApiProperty({
    type: Number,
    description: 'The Id of space to retrieve custom contents from',
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
    id: number;
}
