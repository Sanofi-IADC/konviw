import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString,
} from 'class-validator';

export default class SearchProjectCategoriesQueryDTO {
  @ApiProperty({
    type: String,
    description: 'The Jira server to search in',
    example: 'System JIRA',
  })
  @IsNotEmpty()
  @IsString()
    server: string;

  @ApiProperty({
    type: String,
    description: 'The Jira project key or Id',
    example: '"FACTSWT" or "10000"',
  })
  @IsNotEmpty()
  @IsString()
    projectIdOrKey: string;
}
