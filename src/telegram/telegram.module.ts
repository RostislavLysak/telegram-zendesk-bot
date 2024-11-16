import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { ZendeskService } from '../zendesk/zendesk.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, ZendeskService],
})
export class TelegramModule {}
