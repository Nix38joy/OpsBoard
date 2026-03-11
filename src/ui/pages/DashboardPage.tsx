import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDashboardMetrics } from "../../api/incidents";
import { LIVE_REFRESH_INTERVAL_MS } from "../../domain/liveUpdates";
import { useUiSettingsStore } from "../../state/uiSettingsStore";

export function DashboardPage() {
  const autoRefreshEnabled = useUiSettingsStore((state) => state.autoRefreshEnabled);
  const metricsQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardMetrics,
    refetchInterval: autoRefreshEnabled ? LIVE_REFRESH_INTERVAL_MS : false,
  });

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Operational KPI snapshot based on current incident data.</p>
      <p className="muted-text">
        {autoRefreshEnabled ? "Live updates every 15 seconds." : "Live updates are paused."}
      </p>
      {metricsQuery.isLoading && <p>Loading dashboard metrics...</p>}
      {metricsQuery.isFetching && !metricsQuery.isLoading && (
        <p className="muted-text">Refreshing metrics...</p>
      )}
      {metricsQuery.isError && (
        <p className="error-text">Could not load metrics. Try refreshing the page.</p>
      )}
      {!metricsQuery.isLoading && !metricsQuery.isError && metricsQuery.data && (
        <>
          {metricsQuery.data.length === 0 ? (
            <p className="muted-text">No metrics available yet.</p>
          ) : (
            <div className="metrics-grid">
              {metricsQuery.data.map((metric) => (
                <Link className="card metric-card metric-link" to={metric.to} key={metric.id}>
                  <h2>{metric.label}</h2>
                  <p>{metric.value}</p>
                  <small>{metric.description}</small>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
