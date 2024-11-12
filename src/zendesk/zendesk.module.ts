import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Импортируем HttpModule из @nestjs/axios
import { ZendeskService } from './zendesk.service';

@Module({
  imports: [HttpModule], // Включаем HttpModule в импорт
  providers: [ZendeskService],
  exports: [ZendeskService], // Экспортируем для использования в других частях приложения
})
export class ZendeskModule {}
