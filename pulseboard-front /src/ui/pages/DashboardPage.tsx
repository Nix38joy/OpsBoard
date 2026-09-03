import { PermissionGuard } from '../components/PermissionGuard';

import React, { useMemo } from 'react';
import { useIncidentsFiltersStore } from '../../state/incidentsFiltersStore';
import { getSeverityAnalytics } from '../../domain/analytics';
import { IncidentPieChart } from './IncidentPieChart';
import { getIncidentSla } from '../../domain/sla';
import { Incident } from '../../domain/incidents';

export const DashboardPage: React.FC = () => {
  // 1. Берем фильтры и экшены строго по твоей архитектуре стейта
  const { filters, setSearch, setStatus, setSeverity, resetFilters } = useIncidentsFiltersStore();

   // 2. Временный мок-массив инцидентов для теста с полной типизацией
  const incidents: Incident[] = useMemo(() => [
    { id: 'INC-2026-001', title: 'Сбой репликации Postgres', team: 'DBA Team', severity: 'critical', priority: 'p1', assignee: 'Иван Иванов', status: 'open', description: 'Падение мастер-ноды', createdAt: Date.now() - 3600000, updatedAt: Date.now() },
    { id: 'INC-2026-002', title: 'Потеря пакетов на шлюзе', team: 'Network Team', severity: 'high', priority: 'p2', assignee: 'Петр Петров', status: 'in_progress', description: 'Сбой роутера', createdAt: Date.now() - 7200000, updatedAt: Date.now() },
    { id: 'INC-2026-003', title: 'Утечка памяти в API', team: 'DevOps Team', severity: 'medium', priority: 'p3', assignee: 'Сидор Сидоров', status: 'open', description: 'Перегрузка Node.js', createdAt: Date.now() - 10000000, updatedAt: Date.now() },
    { id: 'INC-2026-004', title: 'DDoS атака на фронт', team: 'SecOps Team', severity: 'critical', priority: 'p1', assignee: 'Алексей Алексеев', status: 'open', description: 'Флуд запросами', createdAt: Date.now() - 1800000, updatedAt: Date.now() },
  ] as unknown as Incident[], []);


  const nowMs = useMemo(() => Date.now(), []);

  // 3. Синхронизируем фильтрацию с твоим стейтом
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch = incident.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                            incident.id.toLowerCase().includes(filters.search.toLowerCase());
      const matchesStatus = filters.status === 'all' || incident.status === filters.status;
      const matchesSeverity = filters.severity === 'all' || incident.severity === filters.severity;
      
      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [incidents, filters.search, filters.status, filters.severity]);

  // 4. Расчет счетчиков
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

  // 5. Трансформируем данные для графика
  const chartData = useMemo(() => {
    return getSeverityAnalytics(filteredIncidents);
  }, [filteredIncidents]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-800">
      {/* Шапка */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ситуационный центр PulseBoard</h1>
          <p className="text-sm text-slate-500 mt-1">Мониторинг аварий и SLA в реальном времени</p>
        </div>

        {/* Фильтры, подключенные к твоему Zustand */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Поиск по ID или названию..."
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
          
          <select
            value={filters.status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          >
            <option value="all">Все статусы</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filters.severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          >
            <option value="all">Вся критичность</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

                    <PermissionGuard 
            check="editIncident"
            fallback={
              <button 
                disabled
                className="px-4 py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded-xl border border-slate-200 cursor-not-allowed flex items-center gap-1 shadow-sm"
                title="У вас недостаточно прав для изменения фильтров смены"
              >
                🔒 Сбросить
              </button>
            }
          >
            <button 
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              Сбросить
            </button>
          </PermissionGuard>

        </div>
      </div>

      {/* 📊 Метрики и График */}
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

        {/* Интерактивный круговой график */}
        <IncidentPieChart data={chartData} />
      </div>

      {/* Реестр */}
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


