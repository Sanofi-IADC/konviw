import { Module, HttpModule } from '@nestjs/common';
import { JiraService } from './jira.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [JiraService],
  exports: [JiraService],
})
export class JiraModule {}
