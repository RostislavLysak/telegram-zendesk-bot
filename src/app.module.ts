// src/app.module.ts
import { Module } from '@nestjs/common';
import { TelegramModule } from './telegram/telegram.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZendeskModule } from './zendesk/zendesk.module';
import { GlobalModule } from './global/global.module';

@Module({
  imports: [TelegramModule, ZendeskModule, GlobalModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
