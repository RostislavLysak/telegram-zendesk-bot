import { Module } from '@nestjs/common';
import { ZendeskService } from '@/zendesk/zendesk.service';

@Module({
  providers: [ZendeskService],
  exports: [ZendeskService],
})
export class ZendeskModule {}
