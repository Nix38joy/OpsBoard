import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getIncidents } from "../../api/incidents";
import { useI18n } from "../../i18n/useI18n";
import { IncidentsFilters } from "../../domain/incidents";
import { LIVE_REFRESH_INTERVAL_MS } from "../../domain/liveUpdates";
import { formatSlaRemaining, getIncidentSla } from "../../domain/sla";
import { useIncidentsFiltersStore } from "../../state/incidentsFiltersStore";
import { useUiSettingsStore } from "../../state/uiSettingsStore";

export function IncidentsPage() {
  const autoRefreshEnabled = useUiSettingsStore((state) => state.autoRefreshEnabled);
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    filters,
    setSearch,
    setSeverity,
    setStatus,
    setSla,
    setOverdueOnly,
    setPage,
    resetFilters,
    setFromUrl,
  } = useIncidentsFiltersStore();

  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page") ?? "1");
    const statusFromUrl = searchParams.get("status");
    const severityFromUrl = searchParams.get("severity");
    const slaFromUrl = searchParams.get("sla");
    const searchFromUrl = searchParams.get("search");
    const overdueFromUrl = searchParams.get("overdue");

    const nextState: Partial<IncidentsFilters> = {
      page: Number.isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl,
      overdueOnly: overdueFromUrl === "1",
    };

    if (
      statusFromUrl === "all" ||
      statusFromUrl === "open" ||
      statusFromUrl === "in_progress" ||
      statusFromUrl === "resolved" ||
      statusFromUrl === "closed"
    ) {
      nextState.status = statusFromUrl;
    }

    if (
      severityFromUrl === "all" ||
      severityFromUrl === "low" ||
      severityFromUrl === "medium" ||
      severityFromUrl === "high" ||
      severityFromUrl === "critical"
    ) {
      nextState.severity = severityFromUrl;
    }

    if (
      slaFromUrl === "all" ||
      slaFromUrl === "at_risk" ||
      slaFromUrl === "breached"
    ) {
      nextState.sla = slaFromUrl;
    }

    if (searchFromUrl !== null) {
      nextState.search = searchFromUrl;
    }

    setFromUrl(nextState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) {
      params.set("search", filters.search);
    }
    if (filters.status !== "all") {
      params.set("status", filters.status);
    }
    if (filters.severity !== "all") {
      params.set("severity", filters.severity);
    }
    if (filters.sla !== "all") {
      params.set("sla", filters.sla);
    }
    if (filters.overdueOnly) {
      params.set("overdue", "1");
    }
    if (filters.page > 1) {
      params.set("page", String(filters.page));
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const incidentsQuery = useQuery({
    queryKey: ["incidents", filters],
    queryFn: () => getIncidents(filters),
    placeholderData: (previousData) => previousData,
    refetchInterval: autoRefreshEnabled ? LIVE_REFRESH_INTERVAL_MS : false,
  });

  const totalPages = incidentsQuery.data?.totalPages ?? 1;
  const canGoPrev = filters.page > 1;
  const canGoNext = filters.page < totalPages;
  const isRefreshing = incidentsQuery.isFetching && !incidentsQuery.isLoading;

  useEffect(() => {
    if (incidentsQuery.data && filters.page > incidentsQuery.data.totalPages) {
      setPage(incidentsQuery.data.totalPages);
    }
  }, [filters.page, incidentsQuery.data, setPage]);

  const handleReset = () => {
    resetFilters();
    setSearchParams({}, { replace: true });
  };

  const statusLabelByValue: Record<IncidentsFilters["status"], string> = {
    all: t("statusAll"),
    open: t("statusOpen"),
    in_progress: t("statusInProgress"),
    resolved: t("statusResolved"),
    closed: t("statusClosed"),
  };
  const severityLabelByValue: Record<IncidentsFilters["severity"], string> = {
    all: t("severityAll"),
    low: t("severityLow"),
    medium: t("severityMedium"),
    high: t("severityHigh"),
    critical: t("severityCritical"),
  };

  return (
    <div className="page">
      <h1>{t("incidentsTitle")}</h1>
      <p>{t("incidentsSubtitle")}</p>
      <p className="muted-text">
        {autoRefreshEnabled ? t("commonLiveUpdatesOn") : t("commonLiveUpdatesOff")}
      </p>
      <div className="actions-row">
        <button
          className="btn ghost"
          type="button"
          onClick={() => void incidentsQuery.refetch()}
          disabled={incidentsQuery.isFetching}
        >
          {incidentsQuery.isFetching ? t("commonRefreshing") : t("commonRefreshNow")}
        </button>
      </div>

      <section className="card filters-card">
        <div className="filters-grid">
          <label className="field">
            <span>{t("incidentsSearch")}</span>
            <input
              className="input"
              placeholder={t("incidentsSearchPlaceholder")}
              value={filters.search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="field">
            <span>{t("incidentsStatus")}</span>
            <select
              className="input"
              value={filters.status}
              onChange={(event) => setStatus(event.target.value as IncidentsFilters["status"])}
            >
              <option value="all">{t("statusAll")}</option>
              <option value="open">{t("statusOpen")}</option>
              <option value="in_progress">{t("statusInProgress")}</option>
              <option value="resolved">{t("statusResolved")}</option>
              <option value="closed">{t("statusClosed")}</option>
            </select>
          </label>
          <label className="field">
            <span>{t("incidentsSeverity")}</span>
            <select
              className="input"
              value={filters.severity}
              onChange={(event) =>
                setSeverity(event.target.value as IncidentsFilters["severity"])
              }
            >
              <option value="all">{t("severityAll")}</option>
              <option value="low">{t("severityLow")}</option>
              <option value="medium">{t("severityMedium")}</option>
              <option value="high">{t("severityHigh")}</option>
              <option value="critical">{t("severityCritical")}</option>
            </select>
          </label>
          <label className="field">
            <span>{t("incidentsSlaFilter")}</span>
            <select
              className="input"
              value={filters.sla}
              onChange={(event) => setSla(event.target.value as IncidentsFilters["sla"])}
            >
              <option value="all">{t("slaFilterAll")}</option>
              <option value="at_risk">{t("slaFilterAtRisk")}</option>
              <option value="breached">{t("slaFilterBreached")}</option>
            </select>
          </label>
          <label className="field">
            <span>{t("incidentsFlags")}</span>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={filters.overdueOnly}
                onChange={(event) => setOverdueOnly(event.target.checked)}
              />
              <span>{t("incidentsOverdueOnly")}</span>
            </label>
          </label>
        </div>
        <button className="btn ghost" type="button" onClick={handleReset}>
          {t("incidentsResetFilters")}
        </button>
      </section>

      <div className="card">
        {incidentsQuery.isLoading && <p>{t("incidentsLoading")}</p>}
        {isRefreshing && <p className="muted-text">{t("incidentsUpdating")}</p>}
        {incidentsQuery.isError && (
          <p className="error-text">{t("incidentsLoadError")}</p>
        )}
        {!incidentsQuery.isLoading && !incidentsQuery.isError && incidentsQuery.data && (
          <>
            {incidentsQuery.data.items.length === 0 ? (
              <p>{t("incidentsEmpty")}</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("incidentsTableId")}</th>
                      <th>{t("incidentsTableTitle")}</th>
                      <th>{t("incidentsSeverity")}</th>
                      <th>{t("incidentsTablePriority")}</th>
                      <th>{t("incidentsStatus")}</th>
                      <th>{t("incidentsTableTeam")}</th>
                      <th>{t("incidentsTableAssignee")}</th>
                      <th>{t("incidentsTableUpdated")}</th>
                      <th>{t("incidentsTableSla")}</th>
                      <th>{t("incidentsTableActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidentsQuery.data.items.map((item) => {
                      const sla = getIncidentSla(item);
                      return (
                        <tr key={item.id}>
                          <td>
                            <Link to={`/incidents/${item.id}`}>{item.id}</Link>
                          </td>
                          <td>{item.title}</td>
                          <td>
                            <span className={`pill pill-severity-${item.severity}`}>
                              {severityLabelByValue[item.severity]}
                            </span>
                          </td>
                          <td>
                            <span className="pill pill-priority">{item.priority.toUpperCase()}</span>
                          </td>
                          <td>
                            <span className={`pill pill-status-${item.status}`}>
                              {statusLabelByValue[item.status]}
                            </span>
                          </td>
                          <td>{item.team}</td>
                          <td>{item.assignee}</td>
                          <td>{new Date(item.updatedAt).toLocaleString()}</td>
                          <td>
                            {!sla.isTracked ? (
                              <span className="muted-text">{t("slaNotTracked")}</span>
                            ) : sla.isBreached ? (
                              <span className="pill pill-sla-breached">{t("slaBreached")}</span>
                            ) : sla.isAtRisk ? (
                              <span className="pill pill-sla-risk">
                                {t("slaAtRisk")}: {t("slaIn", { time: formatSlaRemaining(sla.remainingMs ?? 0) })}
                              </span>
                            ) : (
                              <span className="pill pill-sla-ok">
                                {t("slaIn", { time: formatSlaRemaining(sla.remainingMs ?? 0) })}
                              </span>
                            )}
                          </td>
                          <td>
                            <Link className="table-action-link" to={`/incidents/${item.id}`}>
                              {t("incidentsOpen")}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="table-footer">
              <p>
                {t("incidentsTotal")}: <strong>{incidentsQuery.data.total}</strong>
              </p>
              <div className="pagination">
                <button
                  className="btn ghost"
                  type="button"
                  disabled={!canGoPrev}
                  onClick={() => setPage(filters.page - 1)}
                >
                  {t("incidentsPrev")}
                </button>
                <span>
                  {t("incidentsPage")} {filters.page} / {totalPages}
                </span>
                <button
                  className="btn ghost"
                  type="button"
                  disabled={!canGoNext}
                  onClick={() => setPage(filters.page + 1)}
                >
                  {t("incidentsNext")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
