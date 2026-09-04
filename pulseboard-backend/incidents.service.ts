import { Injectable, OnModuleInit } from '@nestjs/common';
// @ts-ignore
import { PrismaClient } from '@prisma/client';

@Injectable()
export class IncidentsService implements OnModuleInit {
  // Инициализируем клиент Prisma сразу при объявлении свойства
  // @ts-ignore
  private prisma = new PrismaClient();

  // Принудительно подключаемся к PostgreSQL в момент старта NestJS
  async onModuleInit() {
    try {
      await this.prisma.$connect();
      console.log('🔌 [Prisma] Успешное физическое подключение к PostgreSQL!');
    } catch (err) {
      console.error('❌ [Prisma] Не удалось подключиться к базе данных:', err);
    }
  }

  // Метод получения всех инцидентов
  async findAll() {
    // Явно возвращаем результат запроса к базе данных
    return await this.prisma.incident.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

