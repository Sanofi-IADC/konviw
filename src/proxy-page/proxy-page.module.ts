import { Module } from '@nestjs/common';
import { ConfluenceModule } from '../confluence/confluence.module';
import { ContextService } from '../context/context.service';
import { ProxyPageService } from './proxy-page.service';
import { ProxyPageController } from './proxy-page.controller';

@Module({
  imports: [ConfluenceModule],
  providers: [ProxyPageService, ContextService],
  controllers: [ProxyPageController],
  exports: [],
})
export class ProxyPageModule {}
