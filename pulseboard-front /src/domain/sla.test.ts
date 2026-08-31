import { describe, it, expect } from "vitest";
import { getIncidentSla } from "./sla";
import { Incident } from "./incidents";

describe("Бизнес-логика SLA", () => {
  
  it("должна отключать трекинг SLA, если инцидент решен", () => {
    // 1. Создаем тестовый объект инцидента в статусе 'resolved'
    const mockIncident: Incident = {
      id: "INC-TEST-001",
      title: "Тестовая авария",
      description: "Тест",
      status: "resolved", // ✨ Главный триггер для проверки
      priority: "p1",
      severity: "high",
      team: "DBA Team",
      assignee: "",
      updatedAt: "2026-08-05T12:00:00.000Z",
    };

    // 2. Вызываем нашу функцию из файла sla.ts
    const result = getIncidentSla(mockIncident);

    // 3. Проверяем, что функция вернула isTracked: false
    expect(result.isTracked).toBe(false);
    expect(result.remainingMs).toBeNull();
  });

   it("должна корректно рассчитывать оставшееся время для нового инцидента", () => {
    // 1. Создаем инцидент со статусом 'open' и приоритетом 'p1' (лимит 2 часа)
    const mockIncident: Incident = {
      id: "INC-TEST-002",
      title: "Падение авторизации",
      description: "Критический сбой",
      status: "open",
      priority: "p1", // 2 часа = 120 минут
      severity: "critical",
      team: "Network Team",
      assignee: "",
      updatedAt: "2026-08-05T12:00:00.000Z", // 🕰️ Точка отсчета (12:00)
    };

    // 2. Имитируем проверку пульта через 30 минут (30 мин * 60 сек * 1000 мс = 1 800 000 мс)
    const startTimeMs = new Date(mockIncident.updatedAt).getTime();
    const futureCheckTimeMs = startTimeMs + (30 * 60 * 1000); // Время на часах 12:30

    // 3. Вызываем функцию, передавая ей искусственное время проверки
    const result = getIncidentSla(mockIncident, futureCheckTimeMs);

    // 4. Ожидаем, что осталось ровно 90 минут (90 * 60 * 1000 = 5 400 000 мс)
    const expectedRemainingMs = 90 * 60 * 1000;

    expect(result.isTracked).toBe(true);
    expect(result.isBreached).toBe(false);
    expect(result.remainingMs).toBe(expectedRemainingMs);
  });

    it("должна выставлять флаг isAtRisk, если до дедлайна осталось менее 25% времени", () => {
    // 1. Создаем инцидент p1 (лимит 2 часа)
    const mockIncident: Incident = {
      id: "INC-TEST-003",
      title: "Сбой сетевого шлюза",
      description: "Тест лимита риска",
      status: "open",
      priority: "p1",
      severity: "high",
      team: "Network Team",
      assignee: "",
      updatedAt: "2026-08-05T12:00:00.000Z", // 🕰️ Точка отсчета (12:00)
    };

    const startTimeMs = new Date(mockIncident.updatedAt).getTime();
    
    // 2. Имитируем проверку через 1 час 35 минут (95 минут в миллисекундах)
    // Остается 25 минут до дедлайна (это меньше 25% от общего времени)
    const checkTimeMs = startTimeMs + (95 * 60 * 1000); 

    // 3. Вызываем калькулятор SLA
    const result = getIncidentSla(mockIncident, checkTimeMs);

    // 4. Проверяем флаги
    expect(result.isTracked).toBe(true);
    expect(result.isBreached).toBe(false); // Еще не просрочен!
    expect(result.isAtRisk).toBe(true);    // Но уже под угрозой штрафа!
  });

});
