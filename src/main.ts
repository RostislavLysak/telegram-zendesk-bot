import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TelegramService } from './telegram/telegram/telegram.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 3000);

  const telegramService = app.get(TelegramService);

  // Устанавливаем вебхук на старте приложения
  await telegramService.setWebhook();
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
