import { Module } from '@nestjs/common';
import { HttpModule } from '../http/http.module';
import { ConfluenceService } from './confluence.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [ConfluenceService],
  exports: [ConfluenceService],
})
export class ConfluenceModule {}
