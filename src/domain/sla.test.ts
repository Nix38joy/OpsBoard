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
      assignee: null,
      commentsCount: 0,
      createdAt: "2026-08-05T12:00:00.000Z",
      updatedAt: "2026-08-05T12:00:00.000Z",
    };

    // 2. Вызываем нашу функцию из файла sla.ts
    const result = getIncidentSla(mockIncident);

    // 3. Проверяем, что функция вернула isTracked: false
    expect(result.isTracked).toBe(false);
    expect(result.remainingMs).toBeNull();
  });

});
