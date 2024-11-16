import { Module } from '@nestjs/common';
import { TelegramController } from '@/telegram/telegram.controller';
import { TelegramService } from '@/telegram/telegram.service';
import { ZendeskService } from '@/zendesk/zendesk.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, ZendeskService],
})
export class TelegramModule {}
