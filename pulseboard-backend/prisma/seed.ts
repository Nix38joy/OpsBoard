import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


async function main() {
  console.log('🌱 Начинаем засев базы данных реальными инцидентами...');

  // Очищаем таблицу перед засевом, чтобы не плодить дубликаты при повторном запуске
  await prisma.incident.deleteMany();

  // Создаем массив эталонных аварий для Ситуационного центра
  const mockIncidents = [
    {
      title: 'Сбой репликации основной базы Postgres',
      description: 'Авария на мастере. Реплики отстают более чем на 500 Гб. Риск потери данных.',
      team: 'DBA Team',
      severity: 'critical',
      priority: 'p1',
      assignee: 'Александр Вершинин',
      status: 'open',
    },
    {
      title: 'Потеря пакетов >15% на магистральном шлюзе',
      description: 'Проблема на стороне провайдера уровня Tier-1. Зафиксированы падения VPN-туннелей.',
      team: 'Network Team',
      severity: 'high',
      priority: 'p2',
      assignee: 'Дмитрий Назаров',
      status: 'in_progress',
    },
    {
      title: 'Утечка памяти в микросервисе Auth-API',
      description: 'Контейнеры уходят в OOM (Out Of Memory) каждые 40 минут после обновления.',
      team: 'DevOps Team',
      severity: 'medium',
      priority: 'p3',
      assignee: 'Игорь Карташов',
      status: 'open',
    },
    {
      title: 'Аномальный всплеск трафика (DDoS-атака)',
      description: 'Фиксируется флуд POST-запросов на эндпоинт авторизации. Включен режим повышенной защиты Cloudflare.',
      team: 'SecOps Team',
      severity: 'critical',
      priority: 'p1',
      assignee: 'Олег Белов',
      status: 'open',
    },
  ];

  // Массово сохраняем инциденты в твою реальную базу PostgreSQL
  for (const incident of mockIncidents) {
    const created = await prisma.incident.create({
      data: incident,
    });
    console.log(`✅ Создан инцидент: [${created.id}] ${created.title}`);
  }

  console.log('🎉 База данных PostgreSQL успешно засеяна авариями!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка во время засева базы:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
