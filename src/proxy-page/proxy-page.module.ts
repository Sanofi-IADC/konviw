import { Module } from '@nestjs/common';
import { ConfluenceModule } from '../confluence/confluence.module';
import { ContextService } from '../context/context.service';
import { ProxyPageService } from './proxy-page.service';
import { ProxyPageController } from './proxy-page.controller';
import { JiraModule } from 'src/jira/jira.module';
import { HttpModule } from 'src/http/http.module';

@Module({
  imports: [ConfluenceModule, JiraModule, HttpModule],
  providers: [ProxyPageService, ContextService],
  controllers: [ProxyPageController],
  exports: [],
})
export class ProxyPageModule {}
