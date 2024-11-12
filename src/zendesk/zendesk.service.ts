import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios'; // Импортируем HttpService из пакета @nestjs/axios
import * as FormData from 'form-data'; // Для работы с формой и загрузкой файлов
import axios from 'axios';
import * as path from 'path';

@Injectable()
export class ZendeskService {
  private readonly logger = new Logger(ZendeskService.name);

  private readonly ZENDESK_API_TOKEN =
    'isBEKmcJw4lAdXuMp4sAqjgQI4TFNTWnmlM41q0h'; // API токен для Zendesk
  private readonly ZENDESK_DOMAIN = 'paycordsupport'; // Домен Zendesk
  private readonly ZENDESK_EMAIL = 'akhmed.a@paycord.com'; // Ваш email для Zendesk
  private readonly TELEGRAM_TOKEN =
    '7221468289:AAFDq65rV554TsvtQnWqMpSKXjLjow9HZa8'; // Токен Telegram

  constructor(private readonly httpService: HttpService) {}

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

    const fileLinkUrl = `https://api.telegram.org/bot${this.TELEGRAM_TOKEN}/getFile?file_id=${fileContainer.url}`;

    try {
      // Получаем информацию о файле
      const fileLinkResponse = await axios.get(fileLinkUrl);
      const filePath = fileLinkResponse.data.result.file_path;
      console.log('filePath', filePath);

      const fileDownloadUrl = `https://api.telegram.org/file/bot${this.TELEGRAM_TOKEN}/${filePath}`;
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
      const uploadUrl = `https://${this.ZENDESK_DOMAIN}.zendesk.com/api/v2/uploads.json?filename=${fileContainer.fileName}`;

      // Отправляем файл через axios с использованием blob
      const uploadResponse = await axios({
        method: 'POST',
        url: uploadUrl,
        data: fileBlob,
        headers: {
          'Content-Type': 'application/octet-stream',
          Authorization: `Basic ${Buffer.from(`${this.ZENDESK_EMAIL}/token:${this.ZENDESK_API_TOKEN}`).toString('base64')}`,
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
            body: 'Файл прикреплен',
            uploads: [attachmentToken],
          },
        },
      };

      // Прикрепляем файл к тикету в Zendesk
      const attachResponse = await axios.put(
        `https://${this.ZENDESK_DOMAIN}.zendesk.com/api/v2/tickets/${ticketId}.json`,
        attachPayload,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.ZENDESK_EMAIL}/token:${this.ZENDESK_API_TOKEN}`).toString('base64')}`,
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

  // Функция для скачивания файла
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

  // Функция для получения MIME типа на основе расширения файла
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
        return 'application/octet-stream'; // Для всех других типов
    }
  }
}
