import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString,
} from 'class-validator';

export default class GetAttachmentByIdParamsDTO {
  @ApiProperty({
    type: String,
    description: 'The Id of attachment to retrieve',
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
    id: string;
}
