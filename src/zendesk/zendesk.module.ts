import { Module } from '@nestjs/common';
import { ZendeskService } from './zendesk.service';

@Module({
  providers: [ZendeskService],
  exports: [ZendeskService],
})
export class ZendeskModule {}
