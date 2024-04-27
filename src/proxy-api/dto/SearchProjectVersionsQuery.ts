import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString,
} from 'class-validator';

export default class SearchProjectVersionsQueryDTO {
  @ApiProperty({
    type: String,
    description: 'The Jira project key or Id',
    example: '"FACTSWT" or "10000"',
  })
  @IsNotEmpty()
  @IsString()
    projectIdOrKey: string;
}
