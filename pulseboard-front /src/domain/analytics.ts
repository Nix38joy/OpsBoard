import { Incident } from './incidents';

// Интерфейс данных, который строго требует библиотека Recharts
export interface SeverityChartData {
  name: string;
  value: number;
  color: string;
}

/**
 * Чистая функция-трансформер: группирует инциденты по критичности
 */
export function getSeverityAnalytics(incidents: Incident[]): SeverityChartData[] {
  // 1. Задаем базовую структуру с эталонными цветами из нашей дизайн-системы
  const stats = {
    critical: { name: 'Критический', value: 0, color: '#ef4444' }, // Red
    high: { name: 'Высокий', value: 0, color: '#f97316' },     // Orange
    medium: { name: 'Средний', value: 0, color: '#eab308' },     // Yellow
    low: { name: 'Низкий', value: 0, color: '#3b82f6' },        // Blue
  };

  // 2. Бежим циклом по массиву инцидентов и инкрементируем счетчики
  incidents.forEach((incident) => {
    const severity = incident.severity;
    if (stats[severity]) {
      stats[severity].value += 1;
    }
  });

  // 3. Возвращаем результат в виде простого массива объектов, отсекая пустые категории
  return Object.values(stats).filter(item => item.value > 0);
}
