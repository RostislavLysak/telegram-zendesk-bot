import { Controller, Post, Body } from '@nestjs/common';

import { TelegramService } from '@/telegram/telegram.service';

@Controller('api/telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  async handleTelegramWebhook(@Body() body: any) {
    return await this.telegramService.telegramWebhook(body);
  }
}
