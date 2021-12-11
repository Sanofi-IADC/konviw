import { Module } from '@nestjs/common';
import { ConfluenceModule } from '../confluence/confluence.module';
import { ContextService } from '../context/context.service';
import { ProxyApiService } from './proxy-api.service';
import { ProxyApiController } from './proxy-api.controller';
import { JiraModule } from 'src/jira/jira.module';

@Module({
  imports: [ConfluenceModule, JiraModule],
  providers: [ProxyApiService, ContextService],
  controllers: [ProxyApiController],
  exports: [],
})
export class ProxyApiModule {}
