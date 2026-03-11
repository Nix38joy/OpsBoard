import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDashboardMetrics } from "../../api/incidents";
import { useI18n } from "../../i18n/useI18n";
import { LIVE_REFRESH_INTERVAL_MS } from "../../domain/liveUpdates";
import { useUiSettingsStore } from "../../state/uiSettingsStore";

export function DashboardPage() {
  const autoRefreshEnabled = useUiSettingsStore((state) => state.autoRefreshEnabled);
  const { t } = useI18n();
  const metricsQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardMetrics,
    refetchInterval: autoRefreshEnabled ? LIVE_REFRESH_INTERVAL_MS : false,
  });

  const metricLabelById: Record<string, string> = {
    open: t("statusOpen"),
    overdue: t("incidentsOverdueOnly"),
    resolved7d: t("dashboardLabelResolved7d"),
    criticalActive: t("dashboardLabelCriticalActive"),
  };
  const metricDescriptionById: Record<string, string> = {
    open: t("dashboardDescOpen"),
    overdue: t("dashboardDescOverdue"),
    resolved7d: t("dashboardDescResolved7d"),
    criticalActive: t("dashboardDescCriticalActive"),
  };

  return (
    <div className="page">
      <h1>{t("dashboardTitle")}</h1>
      <p>{t("dashboardSubtitle")}</p>
      <p className="muted-text">
        {autoRefreshEnabled ? t("commonLiveUpdatesOn") : t("commonLiveUpdatesOff")}
      </p>
      <div className="actions-row">
        <button
          className="btn ghost"
          type="button"
          onClick={() => void metricsQuery.refetch()}
          disabled={metricsQuery.isFetching}
        >
          {metricsQuery.isFetching ? t("commonRefreshing") : t("commonRefreshNow")}
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
    </div>
  );
}
