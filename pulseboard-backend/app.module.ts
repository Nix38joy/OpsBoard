import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [],
  controllers: [AppController, IncidentsController], // Добавили Контроллер аварий!
  providers: [IncidentsService],                     // Добавили Сервис базы данных!
})
export class AppModule {}

