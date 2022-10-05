import { Module } from '@nestjs/common';
import { JiraModule } from '../jira/jira.module';
import { HttpModule } from '../http/http.module';
import { ConfluenceModule } from '../confluence/confluence.module';
import { ContextService } from '../context/context.service';
import { ProxyApiService } from './proxy-api.service';
import { ProxyApiController } from './proxy-api.controller';

@Module({
  imports: [ConfluenceModule, JiraModule, HttpModule],
  providers: [ProxyApiService, ContextService],
  controllers: [ProxyApiController],
  exports: [],
})
export class ProxyApiModule {}
