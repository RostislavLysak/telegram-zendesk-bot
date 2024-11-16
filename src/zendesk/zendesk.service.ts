import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';

@Injectable()
export class ZendeskService {
  constructor(private readonly config: ConfigService<Config>) {}

  private async getFileBuffer(fileUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });
      return response.data;
    } catch (error) {
      console.log('Ошибка при скачивании файла:', error.message);
      throw new Error('Ошибка при скачивании файла');
    }
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    console.log(`Detected extension: ${ext}`);

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  async createZendeskTicket(text: string, title: string): Promise<number> {
    const url = `https://${this.config.get('ZENDESK_DOMAIN')}.zendesk.com/api/v2/tickets.json`;

    const payload = {
      ticket: {
        subject: title,
        description: text,
        priority: 'normal',
      },
    };

    // Заголовки для авторизации
    const headers = {
      Authorization: `Basic ${Buffer.from(
        `${this.config.get('ZENDESK_EMAIL')}/token:${this.config.get('ZENDESK_API_TOKEN')}`,
      ).toString('base64')}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.post(url, payload, { headers });

      // Получаем ID тикета из ответа
      const ticketId = response.data.ticket.id;
      console.log(`Ticket created successfully with ID: ${ticketId}`);
      return ticketId;
    } catch (error) {
      //   console.error(
      //     `Ошибка при создании тикета в Zendesk: ${error.response?.data?.description || error.message}`,
      //   );
      console.log(
        `Ошибка при создании тикета в Zendesk: ${error.response?.data?.description || error.message}`,
      );
      throw new Error('Ошибка при создании тикета в Zendesk');
    }
  }

  // Функция для загрузки файла в Zendesk и прикрепления его к тикету
  async sendFileToZendesk(file: any, ticketId: number): Promise<void> {
    let fileContainer;

    // Обрабатываем фото
    if (file?.photo?.length > 0) {
      const largestPhoto = file.photo.reduce((prev, current) => {
        return prev.file_size > current.file_size ? prev : current;
      });
      fileContainer = {
        fileName: largestPhoto.file_unique_id,
        url: largestPhoto.file_id,
      };
    }
    // Обрабатываем документ
    else if (file?.document) {
      fileContainer = {
        fileName: file.document?.file_name || 'unknown_file',
        url: file.document?.file_id,
      };
    } else {
      throw new Error('Не удалось определить файл');
    }

    console.log('fileContainer', fileContainer);

    const fileLinkUrl = `https://api.telegram.org/bot${this.config.get('TELEGRAM_TOKEN')}/getFile?file_id=${fileContainer.url}`;

    try {
      // Получаем информацию о файле
      const fileLinkResponse = await axios.get(fileLinkUrl);
      const filePath = fileLinkResponse.data.result.file_path;
      console.log('filePath', filePath);

      const fileDownloadUrl = `https://api.telegram.org/file/bot${this.config.get('TELEGRAM_TOKEN')}/${filePath}`;
      const fileBuffer = await this.getFileBuffer(fileDownloadUrl);

      // Определяем MIME тип
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = this.getMimeType(ext);
      console.log('Using MIME type:', mimeType);

      // Используем fetch и Blob для загрузки файла
      const localFile = await fetch(
        URL.createObjectURL(new Blob([fileBuffer])),
      );
      const fileBlob = await localFile.blob(); // Создаем blob
      const uploadUrl = `https://${this.config.get('ZENDESK_DOMAIN')}.zendesk.com/api/v2/uploads.json?filename=${fileContainer.fileName}`;

      // Отправляем файл через axios с использованием blob
      const uploadResponse = await axios({
        method: 'POST',
        url: uploadUrl,
        data: fileBlob,
        headers: {
          'Content-Type': 'application/octet-stream',
          Authorization: `Basic ${Buffer.from(`${this.config.get('ZENDESK_EMAIL')}/token:${this.config.get('ZENDESK_API_TOKEN')}`).toString('base64')}`,
        },
      });

      console.log('uploadResponse', uploadResponse.data);

      const attachmentToken = uploadResponse.data?.upload?.token;
      if (!attachmentToken) {
        throw new Error('Не удалось получить токен вложения из ответа Zendesk');
      }

      console.log('attachmentToken', attachmentToken);

      // Формируем payload для прикрепления файла к тикету
      const attachPayload = {
        ticket: {
          comment: {
            body: 'Attachment posted',
            uploads: [attachmentToken],
          },
        },
      };

      // Прикрепляем файл к тикету в Zendesk
      const attachResponse = await axios.put(
        `https://${this.config.get('ZENDESK_DOMAIN')}.zendesk.com/api/v2/tickets/${ticketId}.json`,
        attachPayload,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.config.get('ZENDESK_EMAIL')}/token:${this.config.get('ZENDESK_API_TOKEN')}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(
        `File attached to ticket ${ticketId}: ${attachResponse.data.ticket.id}`,
      );
    } catch (error) {
      console.log(
        'Ошибка при отправке файла в Zendesk:',
        error.response?.data || error.message,
      );
      throw new Error('Ошибка при отправке файла в Zendesk');
    }
  }
}
