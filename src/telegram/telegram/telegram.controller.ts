import { Controller, Post, Body, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios'; // Импортируем HttpService для отправки HTTP запросов
import { firstValueFrom } from 'rxjs'; // Используем для преобразования Observable в Promise
import axios from 'axios';
import { ZendeskService } from 'src/zendesk/zendesk.service';

@Controller('api/telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);
  private readonly TELEGRAM_TOKEN =
    '7221468289:AAFDq65rV554TsvtQnWqMpSKXjLjow9HZa8'; // Ваш Telegram Token

  private readonly ZENDESK_API_TOKEN =
    'isBEKmcJw4lAdXuMp4sAqjgQI4TFNTWnmlM41q0h'; // Ваш API токен для Zendesk
  private readonly ZENDESK_DOMAIN = 'paycordsupport'; // Домен Zendesk (например, "company.zendesk.com")
  private readonly ZENDESK_EMAIL = 'akhmed.a@paycord.com'; // Ваш email для Zendesk (в формате email/token)
  private readonly CHAT_IDS = [-4563291504, -4510632874];
  // Инжектируем HttpService для отправки HTTP запросов
  constructor(
    private readonly httpService: HttpService,
    private readonly zendeskService: ZendeskService,
  ) {}

  // Обработка POST запросов от Telegram
  @Post('webhook')
  async handleTelegramWebhook(@Body() body: any) {
    this.logger.log('Получен запрос от Telegram: ', body);
    console.log('MYBODY: ', body.message);
    console.log('CHATID ', body.message);
    // В этой части кода вы можете обрабатывать сообщение от пользователя
    // Например, создать тикет в Zendesk или отправить ответ обратно в Telegram
    console.log('CONDITIONS: ', body.message);

    // console.log('CONDITIONS: ', body.message);
    // const res = body.message;
    // console.log(res)
    // const file = res.document || res.photo;
    // const message = !!file.length ? res.caption : res.text;
    // if (res && message) {
    //   //   const message = body.message.text;
    //   const chatId = res.chat.id;
    //   const title = res.chat.title;
    //   console.log('NAME', res.chat.title);
    //   //   const file = message.document || message.photo;
    //   //     console.log('FILE', file);
    //   const ticketId = await this.createZendeskTicket(message, title, chatId);
    //   console.log('FILE', file, 'TicketId', ticketId);
    console.log('BODY', body);
    if (body.ticket_id) {
      await Promise.all(
        this.CHAT_IDS.map((i) =>
          this.sendTelegramMessage(i, `Paycord reply: ${body.last_response}`),
        ),
      );

      return 'OK';
    }

    if (body.message && (body.message.text || body.message.caption)) {
      const message = body.message.text || body.message.caption;
      const chatId = body.message.chat.id;
      const title = body.message.chat.title;
      console.log('NAME', body.message.chat.title);
      const file = body.message.document || body.message.photo;
      console.log('FILE', file);
      const ticketId = await this.createZendeskTicket(message, title, chatId);
      //     console.log('FILE', file, "TicketId", ticketId);
      if (file) {
        // Отправляем файл в Zendesk
        this.zendeskService.sendFileToZendesk(body.message, ticketId);
      }
      // Отправляем ответ пользователю
      await this.sendTelegramMessage(chatId, `New ticket create: ${ticketId}`);
    }

    return 'OK'; // Telegram ожидает подтверждение
  }

  // Функция для отправки сообщений в Telegram
  //   private async sendTelegramMessage(chatId: number, text: string): Promise<void> {
  //     const url = `https://api.telegram.org/bot${this.TELEGRAM_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`;

  //     try {
  //       // Используем firstValueFrom для получения первого значения из Observable
  //       const response = await firstValueFrom(this.httpService.get(url));

  //       if (response.data.ok) {
  //         this.logger.log('Сообщение отправлено в Telegram');
  //       } else {
  //         this.logger.error('Ошибка при отправке сообщения в Telegram');
  //       }
  //     } catch (error) {
  //       this.logger.error('Ошибка при отправке сообщения в Telegram', error.response || error.message);
  //     }
  //   }

  async createZendeskTicket(
    text: string,
    title: string,
    chatId: number,
  ): Promise<number> {
    const url = `https://${this.ZENDESK_DOMAIN}.zendesk.com/api/v2/tickets.json`;

    const payload = {
      ticket: {
        subject: title,
        description: text,
        priority: 'normal',
        custom_fields: [
          { id: 'your_custom_field_id', value: chatId }, // Замените на ваш ID кастомного поля
        ],
      },
    };

    // Заголовки для авторизации
    const headers = {
      Authorization: `Basic ${Buffer.from(
        `${this.ZENDESK_EMAIL}/token:${this.ZENDESK_API_TOKEN}`,
      ).toString('base64')}`,
      'Content-Type': 'application/json',
    };

    try {
      // Используем axios для отправки POST запроса
      const response = await axios.post(url, payload, { headers });

      // Получаем ID тикета из ответа
      const ticketId = response.data.ticket.id;
      //   this.logger.log(`Ticket created successfully with ID: ${ticketId}`);
      console.log(`Ticket created successfully with ID: ${ticketId}`);
      return ticketId;
    } catch (error) {
      //   this.logger.error(
      //     `Ошибка при создании тикета в Zendesk: ${error.response?.data?.description || error.message}`,
      //   );
      console.log(
        `Ошибка при создании тикета в Zendesk: ${error.response?.data?.description || error.message}`,
      );
      throw new Error('Ошибка при создании тикета в Zendesk');
    }
  }

  private async sendTelegramMessage(
    chatId: number,
    text: string,
  ): Promise<void> {
    const url = `https://api.telegram.org/bot${this.TELEGRAM_TOKEN}/sendMessage`;

    // Параметры для отправки сообщения
    const params = {
      chat_id: chatId,
      text: text,
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
