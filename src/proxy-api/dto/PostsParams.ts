import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString,
} from 'class-validator';

export default class PostsParamsDTO {
  @ApiProperty({
    type: String,
    description: 'The Confluence space key',
    example: 'konviw',
  })
  @IsNotEmpty()
  @IsString()
    spaceKey: string;
}
