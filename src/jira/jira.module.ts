import { Module } from '@nestjs/common';
import { HttpAtlassianModule } from '../http-atlassian/http-atlassian.module';
import { JiraService } from './jira.service';

@Module({
  imports: [HttpAtlassianModule],
  controllers: [],
  providers: [JiraService],
  exports: [JiraService],
})
export class JiraModule {}
