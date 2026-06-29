import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardMetrics, getIncidents } from "../../api/incidents";
import { useI18n } from "../../i18n/useI18n";
import { LIVE_REFRESH_INTERVAL_MS } from "../../domain/liveUpdates";
import { formatSlaRemaining, getIncidentSla } from "../../domain/sla";
import { useUiSettingsStore } from "../../state/uiSettingsStore";

function SlaCell({ item }: { item: any }) {
  const { t } = useI18n();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const sla = getIncidentSla(item);
    if (!sla.isTracked || sla.isBreached) {
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [item]);

  const sla = getIncidentSla(item);

  if (!sla.isTracked) {
    return <span className="muted-text">{t("slaNotTracked")}</span>;
  }

  if (sla.isBreached) {
    return <span className="pill pill-sla-breached">{t("slaBreached")}</span>;
  }

  const remainingMs = sla.remainingMs ? Math.max(0, sla.remainingMs - (Date.now() - now)) : 0;

  if (remainingMs <= 0) {
    return <span className="pill pill-sla-breached">{t("slaBreached")}</span>;
  }

  if (sla.isAtRisk) {
    return (
      <span className="pill pill-sla-risk">
        {t("slaAtRisk")}: {t("slaIn", { time: formatSlaRemaining(remainingMs) })}
      </span>
    );
  }

  return (
    <span className="pill pill-sla-ok">
      {t("slaIn", { time: formatSlaRemaining(remainingMs) })}
    </span>
  );
}

export function DashboardPage() {
  const autoRefreshEnabled = useUiSettingsStore((state) => state.autoRefreshEnabled);
  const { t } = useI18n();

  const [selectedTeam, setSelectedTeam] = useState<string>("all");

    const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
      
    


    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const availableTeams = ["DBA Team", "Network Team", "Support Team", "Infrastructure Team"];

  const metricsQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardMetrics,
    refetchInterval: autoRefreshEnabled ? LIVE_REFRESH_INTERVAL_MS : false,
  });

  const incidentsQuery = useQuery({
    queryKey: ["incidents-all-dashboard"],
    queryFn: () => getIncidents({ 
      status: "all", 
      severity: "all", 
      sla: "all", 
      overdueOnly: false, 
      page: 1,
      search: "",
      pageSize: 50
    }),
    refetchInterval: autoRefreshEnabled ? LIVE_REFRESH_INTERVAL_MS : false,
  });

  const metricLabelById: Record<string, string> = {
    open: t("statusOpen"),
    overdue: t("incidentsOverdueOnly"),
    resolved7d: t("dashboardLabelResolved7d"),
    criticalActive: t("dashboardLabelCriticalActive"),
    slaBreachedActive: t("dashboardLabelSlaBreached"),
    slaAtRiskActive: t("dashboardLabelSlaAtRisk"),
  };

  const metricDescriptionById: Record<string, string> = {
    open: t("dashboardDescOpen"),
    overdue: t("dashboardDescOverdue"),
    resolved7d: t("dashboardDescResolved7d"),
    criticalActive: t("dashboardDescCriticalActive"),
    slaBreachedActive: t("dashboardDescSlaBreachedActive"),
    slaAtRiskActive: t("dashboardDescSlaAtRiskActive"),
  };

  const filteredIncidents = (incidentsQuery.data?.items ?? []).filter((item) => {
    const isStatusActive = item.status === "open" || item.status === "in_progress";
    const matchesTeam = selectedTeam === "all" || item.team === selectedTeam;
    return isStatusActive && matchesTeam;
  });

  const hotIncidents = [...filteredIncidents]
    .map((item) => ({ item, sla: getIncidentSla(item) }))
    .filter((entry) => entry.sla.isTracked && !entry.sla.isBreached)
    .sort((a, b) => (a.sla.remainingMs ?? 0) - (b.sla.remainingMs ?? 0))
    .slice(0, 3)
    .map((entry) => entry.item);

  const rawHistory = localStorage.getItem("pulseboard.audit.history.v1");
  let auditLogs: Array<{ id: string; userName: string; email: string; role: string; eventType: string; createdAt: string }> = [];
  
  try {
    if (rawHistory) {
      const parsedHistory = JSON.parse(rawHistory);
      if (Array.isArray(parsedHistory)) {
        auditLogs = parsedHistory; // События уже отсортированы на уровне API (новые вверху)
      }
    }
  } catch (e) {
    console.error("Ошибка чтения журнала аудита", e);
  }

  
    return (
    <div className="page">
       <div style={{ padding: "10px", background: "#fff", borderRadius: "6px", marginBottom: "15px", display: "inline-block", fontFamily: "monospace", fontWeight: "bold" }}>
        🕒 Время смены: {currentTime.toLocaleTimeString()}
      </div>
      <h1>{t("dashboardTitle")}</h1>
      <p>{t("dashboardSubtitle")}</p>
      <p className="muted-text">
        {autoRefreshEnabled ? t("commonLiveUpdatesOn") : t("commonLiveUpdatesOff")}
      </p>
      <div className="actions-row">
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            void metricsQuery.refetch();
            void incidentsQuery.refetch();
          }}
          disabled={metricsQuery.isFetching || incidentsQuery.isFetching}
        >
          {metricsQuery.isFetching || incidentsQuery.isFetching ? t("commonRefreshing") : t("commonRefreshNow")}
        </button>
      </div>

      {metricsQuery.isLoading && <p>{t("dashboardLoading")}</p>}
      {metricsQuery.isFetching && !metricsQuery.isLoading && (
        <p className="muted-text">{t("dashboardRefreshing")}</p>
      )}
      {metricsQuery.isError && (
        <p className="error-text">{t("dashboardLoadError")}</p>
      )}

      {!metricsQuery.isLoading && !metricsQuery.isError && metricsQuery.data && (
        <>
          {metricsQuery.data.length === 0 ? (
            <p className="muted-text">{t("dashboardEmpty")}</p>
          ) : (
            <div className="metrics-grid">
              {metricsQuery.data.map((metric) => (
                <Link className="card metric-card metric-link" to={metric.to} key={metric.id}>
                  <h2>{metricLabelById[metric.id] ?? metric.label}</h2>
                  <p>{metric.value}</p>
                  <small>{metricDescriptionById[metric.id] ?? metric.description}</small>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <div className="card" style={{ marginTop: "32px" }}>
        <h2 style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🚨</span> {t("dashboardLabelSlaAtRisk") || "Критические инциденты (SLA под угрозой)"}
        </h2>
        <p className="muted-text" style={{ marginBottom: "16px" }}>
          Инциденты в работе, требующие немедленного вмешательства дежурной смены.
        </p>

        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.9rem", opacity: 0.8, fontWeight: "bold" }}>Фильтр по командам:</span>
          <select
            className="input"
            style={{ width: "220px", padding: "6px 12px", borderRadius: "6px" }}
            value={selectedTeam}
            onChange={(event) => setSelectedTeam(event.target.value)}
          >
            <option value="all">🌐 Все команды</option>
            {availableTeams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        {incidentsQuery.isLoading && <p className="muted-text">{t("incidentsLoading")}</p>}
        
        {!incidentsQuery.isLoading && !incidentsQuery.isError && (
          hotIncidents.length === 0 ? (
            <p className="muted-text">Отлично! Активных инцидентов с горящим SLA для выбранной команды не обнаружено.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t("incidentsTableTitle")}</th>
                    <th>{t("incidentsSeverity")}</th>
                    <th>{t("incidentsStatus")}</th>
                    <th>{t("incidentsTableTeam")}</th>
                    <th>{t("incidentsTableSla")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {hotIncidents.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/incidents/${item.id}`}>#{item.id}</Link>
                      </td>
                      <td style={{ fontWeight: "bold" }}>{item.title}</td>
                      <td>
                        <span className={`pill pill-severity-${item.severity}`}>
                          {item.severity.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`pill pill-status-${item.status}`}>
                          {item.status === "in_progress" ? t("statusInProgress") : t("statusOpen")}
                        </span>
                      </td>
                      <td>{item.team}</td>
                      <td>
                        <SlaCell item={item} />
                      </td>
                      <td>
                        <Link className="table-action-link" to={`/incidents/${item.id}`}>
                          {t("incidentsOpen")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
       <div className="card" style={{ marginTop: "32px", borderLeft: "4px solid #475569" }}>
        <h2 style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📋</span> Журнал безопасности пульта (Audit Log)
        </h2>
        <p className="muted-text" style={{ marginBottom: "20px" }}>
          Официальный реестр регистрации учетных записей и сессий в системе PulseBoard.
        </p>

        {auditLogs.length === 0 ? (
          <p className="muted-text">Журнал пуст. Системные сессии не зафиксированы.</p>
        ) : (
          <div className="table-wrap">
            <table className="table" style={{ fontSize: "0.9rem" }}>
              <thead>
                <tr>
                  <th>Временная метка (UTC)</th>
                  <th>Событие системы</th>
                  <th>Идентификатор</th>
                  <th>Роль доступа</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                                       <td>
                      {log.eventType === "SUCCESS_LOGIN" ? (
                        <span>
                          <span style={{ color: "#0284c7", fontWeight: "bold" }}>⚡ SUCCESS_LOGIN</span>: 
                          Сотрудник <strong style={{ color: "var(--text-main)" }}>{log.userName}</strong> ({log.email}) успешно подключился к пульту управления
                        </span>
                      ) : (
                        <span>
                          <span style={{ color: "#16a34a", fontWeight: "bold" }}>✔ SUCCESS_REGISTER</span>: 
                          Создан новый профиль инженера <strong style={{ color: "var(--text-main)" }}>{log.userName}</strong> ({log.email})
                        </span>
                      )}
                    </td>

                    <td style={{ fontFamily: "monospace", opacity: 0.8 }}>
                      {log.id}
                    </td>
                    <td>
                      <span className={`pill pill-status-${log.role === 'admin' ? 'open' : log.role === 'operator' ? 'in_progress' : 'closed'}`}>
                        {log.role.toUpperCase()}
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
}
