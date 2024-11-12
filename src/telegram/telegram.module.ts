// src/telegram/telegram.module.ts
import { Module } from '@nestjs/common';
import { TelegramController } from './telegram/telegram.controller';
import { TelegramService } from './telegram/telegram.service';
import { HttpModule } from '@nestjs/axios';
import { ZendeskService } from 'src/zendesk/zendesk.service';

@Module({
  imports: [HttpModule],
  controllers: [TelegramController],
  providers: [TelegramService, ZendeskService],
})
export class TelegramModule {}
