import { Module } from '@nestjs/common';
import { HttpAtlassianModule } from '../http-atlassian/http-atlassian.module';
import { ConfluenceService } from './confluence.service';

@Module({
  imports: [HttpAtlassianModule],
  controllers: [],
  providers: [ConfluenceService],
  exports: [ConfluenceService],
})
export class ConfluenceModule {}
