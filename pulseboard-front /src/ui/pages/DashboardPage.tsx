import React, { useState, useMemo } from 'react';
import { useIncidentsFiltersStore } from '../../state/incidentsFiltersStore';
import { getSeverityAnalytics } from '../../domain/analytics';
import { IncidentPieChart } from './IncidentPieChart';
import { getIncidentSla } from '../../domain/sla';
import { Incident } from '../../domain/incidents'; // Импортируем твой тип инцидента

export const DashboardPage: React.FC = () => {
  // 1. Из Zustand берем фильтры, которые там железно есть
  const { selectedTeam, setSelectedTeam } = useIncidentsFiltersStore();
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Временный мок-массив инцидентов для реактивного теста графиков Recharts
  // Как только мы подключим бэкенд, сюда будут прилетать данные из сети!
  const incidents: Incident[] = useMemo(() => [
    { id: 'INC-2026-001', title: 'Сбой репликации Postgres', team: 'DBA Team', severity: 'critical', status: 'open', description: 'Падение мастер-ноды', createdAt: Date.now() - 3600000, updatedAt: Date.now() },
    { id: 'INC-2026-002', title: 'Потеря пакетов на шлюзе', team: 'Network Team', severity: 'high', status: 'in_progress', description: 'Сбой роутера', createdAt: Date.now() - 7200000, updatedAt: Date.now() },
    { id: 'INC-2026-003', title: 'Утечка памяти в API', team: 'DevOps Team', severity: 'medium', status: 'open', description: 'Перегрузка Node.js', createdAt: Date.now() - 10000000, updatedAt: Date.now() },
    { id: 'INC-2026-004', title: 'DDoS атака на фронт', team: 'SecOps Team', severity: 'critical', status: 'open', description: 'Флуд запросами', createdAt: Date.now() - 1800000, updatedAt: Date.now() },
  ], []);

  // 3. Имитируем текущее время для расчета SLA
  const nowMs = useMemo(() => Date.now(), [selectedTeam]);

  // 4. Фильтруем инциденты по выбранной команде и поиску
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesTeam = selectedTeam === 'All' || incident.team === selectedTeam;
      const matchesSearch = incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            incident.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTeam && matchesSearch;
    });
  }, [incidents, selectedTeam, searchQuery]);

  // 5. Считаем верхние метрики (счетчики)
  const metrics = useMemo(() => {
    let openCount = 0;
    let breachedCount = 0;

    filteredIncidents.forEach((incident) => {
      if (incident.status !== 'resolved' && incident.status !== 'closed') {
        openCount++;
        const sla = getIncidentSla(incident, nowMs);
        if (sla.isBreached) {
          breachedCount++;
        }
      }
    });

    return { openCount, breachedCount };
  }, [filteredIncidents, nowMs]);

  // 6. Трансформируем данные для нашего нового кругового графика!
  const chartData = useMemo(() => {
    return getSeverityAnalytics(filteredIncidents);
  }, [filteredIncidents]);

  // Список ИТ-команд для фильтрации
  const teams = ['All', 'Network Team', 'DBA Team', 'SecOps Team', 'DevOps Team'];

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-800">
      {/* Шапка */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ситуационный центр PulseBoard</h1>
          <p className="text-sm text-slate-500 mt-1">Мониторинг аварий и SLA в реальном времени</p>
        </div>

        {/* Фильтры */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Поиск по ID или названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          >
            {teams.map((team) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 📊 Панель метрик и График */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between h-64">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Активные инциденты</span>
            <h3 className="text-4xl font-extrabold text-slate-900 mt-4">{metrics.openCount}</h3>
          </div>
          <p className="text-xs text-slate-500 border-t border-slate-100 pt-4">Требуют внимания дежурной смены</p>
        </div>

        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between h-64">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Просрочено по SLA</span>
            <h3 className="text-4xl font-extrabold text-red-500 mt-4">{metrics.breachedCount}</h3>
          </div>
          <p className="text-xs text-red-400/80 border-t border-slate-100 pt-4 font-medium">⚠️ Нарушение дедлайнов</p>
        </div>

        {/* Наш новый круговой график Recharts */}
        <IncidentPieChart data={chartData} />
      </div>

      {/* Таблица реестра */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Текущие аварийные задачи ({filteredIncidents.length})</h2>
        {filteredIncidents.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Инциденты не найдены</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">Команда</th>
                  <th className="px-4 py-3">Критичность</th>
                  <th className="px-4 py-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{incident.id}</td>
                    <td className="px-4 py-3.5 text-slate-700">{incident.title}</td>
                    <td className="px-4 py-3.5"><span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">{incident.team}</span></td>
                    <td className="px-4 py-3.5">
                      <span className={`font-medium ${incident.severity === 'critical' ? 'text-red-500' : incident.severity === 'high' ? 'text-orange-500' : 'text-slate-600'}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${incident.status === 'open' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        {incident.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

