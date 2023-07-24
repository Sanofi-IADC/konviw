import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString,
} from 'class-validator';

export default class GetScreenDetailsDTO {
  @ApiProperty({
    type: Number,
    description: 'The Jira Project Id',
    example: '12345',
  })
  @IsNotEmpty()
  @IsString()
    projectId: number;

  @ApiProperty({
    type: Number,
    description: 'The Jira Project Issue Type Ids',
    example: '123',
  })
  @IsNotEmpty()
  @IsString()
    issueTypeId: number;
}
