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
}
