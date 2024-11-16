import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';
import { Config } from '@/config';
import { DatabaseService } from '@/database/database.service';
import { ZendeskService } from '@/zendesk/zendesk.service';

@Injectable()
export class TelegramService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService<Config>,
    private readonly db: DatabaseService,
    private readonly zendeskService: ZendeskService,
  ) {}
  // Функция для установки webhook
  async setWebhook() {
    const url = `https://api.telegram.org/bot${this.config.get('TELEGRAM_TOKEN')}/setWebhook?url=${this.config.get('WEBHOOK_URL')}`;
    console.log('SET');
    try {
      const response = await axios.get(url);

      if (response.data.ok) {
        // console.log('RES', response)
        // this.logger.log('Webhook установлен успешно');
        console.log('Webhook установлен успешно');
      } else {
        // this.logger.error('Ошибка при установке webhook');
        console.log('Ошибка при установке webhook');
      }
    } catch (error) {
      // this.logger.error('Ошибка при установке webhook:', error.message);
      console.log('Ошибка при установке webhook:', error.message);
    }
  }

  async telegramWebhook(data: any) {
    console.log('Получен запрос от Telegram: ', data);
    const message = data.message;
    //TODO
    // if (data.ticket_id) {
    //   const ticket = await this.db.ticket.findUnique({
    //     where: {
    //       id: data.ticket_id,
    //     },
    //   });
    //   if (ticket) {
    //     this.sendTelegramMessage(
    //       -1002393630973,
    //       `Paycord reply: ${data.last_response}`,
    //     );
    //   }

    //   return 'OK';
    // }

    if (message && message.media_group_id) {
      const ticket = await this.db.ticket.findFirst({
        where: {
          mediaId: message.media_group_id,
        },
      });

      if (!ticket) {
        const ticketId = await this.zendeskService.createZendeskTicket(
          'Файлы для тикета получены',
          'Тикет с файлами',
        );

        if (ticketId) {
          await this.db.ticket.create({
            data: {
              id: ticketId,
              chatId: message.chat.id,
              mediaId: message.media_group_id,
            },
          });
        }
      }

      const newTiket = await this.db.ticket.findFirst({
        where: {
          mediaId: message.media_group_id,
        },
      });

      await this.zendeskService.sendFileToZendesk(message, newTiket.id);

      if (message.caption) {
        const ticket = await this.db.ticket.findFirst({
          where: {
            mediaId: message.media_group_id,
          },
        });

        await this.sendTelegramMessage(
          message.chat.id,
          `New ticket created ID: *{{${ticket.id}}}*`,
        );
      }
    } else {
      // Обработка обычного текстового сообщения
      if (message.text || message.caption) {
        const textMessage = message.text || message.caption;
        const chatId = message.chat.id;
        const title = message.chat.title;
        console.log(chatId, textMessage, title);

        const ticketId = await this.zendeskService.createZendeskTicket(
          textMessage,
          title,
        );

        // Отправляем ответ пользователю
        if (ticketId) {
          await this.db.ticket.create({
            data: {
              id: ticketId,
              chatId: message.chat.id,
              mediaId: message.media_group_id,
            },
          });

          if (message.document || message.photo) {
            await this.zendeskService.sendFileToZendesk(message, ticketId);
          }

          await this.sendTelegramMessage(
            chatId,
            `New ticket created ID: *${ticketId}*`,
          );
        }
      }
    }

    return 'OK';
  }

  async sendTelegramMessage(
    chatId: number,
    text: string,
    messageId?: number,
  ): Promise<void> {
    const url = `https://api.telegram.org/bot${this.config.get('TELEGRAM_TOKEN')}/sendMessage`;

    // Параметры для отправки сообщения
    const params = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      ...(messageId ? { reply_to_message_id: messageId } : {}),
    };

    try {
      // Используем firstValueFrom для получения первого значения из Observable
      const response = await firstValueFrom(this.httpService.post(url, params));

      if (response.data.ok) {
        console.log('Сообщение отправлено в Telegram');
        // this.logger.log('Сообщение отправлено в Telegram');
      } else {
        console.log('Ошибка при отправке сообщения в Telegram');
        // this.logger.error('Ошибка при отправке сообщения в Telegram');
      }
    } catch (error) {
      console.log('Ошибка при отправке сообщения в Telegram');
      //   this.logger.error(
      //     'Ошибка при отправке сообщения в Telegram',
      //     error.response?.data || error.message,
      //   );
    }
  }
}
