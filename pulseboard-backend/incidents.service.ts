import { Injectable, OnModuleInit } from '@nestjs/common';
// @ts-ignore
import { PrismaClient } from '@prisma/client';

@Injectable()
export class IncidentsService implements OnModuleInit {
  // 🔥 Внедряем клиент Prisma внутрь как свойство
  // @ts-ignore
  private prisma = new PrismaClient();

  // Подключаемся к PostgreSQL при старте сервера
  async onModuleInit() {
    await this.prisma.$connect();
  }

  // Забираем все инциденты из базы, сортируя от свежих к старым
  async findAll() {
    return this.prisma.incident.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
