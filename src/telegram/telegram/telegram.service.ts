import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly TELEGRAM_TOKEN =
    '7221468289:AAFDq65rV554TsvtQnWqMpSKXjLjow9HZa8'; // Ваш токен Telegram
  private readonly WEBHOOK_URL =
    'https://telegram-zendesk-bot.vercel.app/api/telegram/webhook'; // URL от ngrok

  private readonly logger = new Logger(TelegramService.name);

  // Функция для установки webhook
  async setWebhook() {
    const url = `https://api.telegram.org/bot${this.TELEGRAM_TOKEN}/setWebhook?url=${this.WEBHOOK_URL}`;
    console.log('SET');
    try {
      const response = await axios.get(url);

      if (response.data.ok) {
        // console.log('RES', response)
        this.logger.log('Webhook установлен успешно');
      } else {
        this.logger.error('Ошибка при установке webhook');
      }
    } catch (error) {
      this.logger.error('Ошибка при установке webhook:', error.message);
    }
  }
}
