import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getIncidents } from "../../api/incidents";
import { IncidentsFilters } from "../../domain/incidents";
import { useIncidentsFiltersStore } from "../../state/incidentsFiltersStore";

export function IncidentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    filters,
    setSearch,
    setSeverity,
    setStatus,
    setOverdueOnly,
    setPage,
    resetFilters,
    setFromUrl,
  } = useIncidentsFiltersStore();

  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page") ?? "1");
    const statusFromUrl = searchParams.get("status");
    const severityFromUrl = searchParams.get("severity");
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
  });

  const totalPages = incidentsQuery.data?.totalPages ?? 1;
  const canGoPrev = filters.page > 1;
  const canGoNext = filters.page < totalPages;

  const handleReset = () => {
    resetFilters();
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="page">
      <h1>Incidents</h1>
      <p>First production-like data flow: filters + server query + pagination.</p>

      <section className="card filters-card">
        <div className="filters-grid">
          <label className="field">
            <span>Search</span>
            <input
              className="input"
              placeholder="id or title"
              value={filters.search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select
              className="input"
              value={filters.status}
              onChange={(event) => setStatus(event.target.value as IncidentsFilters["status"])}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label className="field">
            <span>Severity</span>
            <select
              className="input"
              value={filters.severity}
              onChange={(event) =>
                setSeverity(event.target.value as IncidentsFilters["severity"])
              }
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="field">
            <span>Flags</span>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={filters.overdueOnly}
                onChange={(event) => setOverdueOnly(event.target.checked)}
              />
              <span>Overdue only</span>
            </label>
          </label>
        </div>
        <button className="btn ghost" type="button" onClick={handleReset}>
          Reset filters
        </button>
      </section>

      <div className="card">
        {incidentsQuery.isLoading && <p>Loading incidents...</p>}
        {incidentsQuery.isError && (
          <p className="error-text">Could not load incidents. Try refreshing the page.</p>
        )}
        {!incidentsQuery.isLoading && !incidentsQuery.isError && incidentsQuery.data && (
          <>
            {incidentsQuery.data.items.length === 0 ? (
              <p>No incidents found for current filters.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Team</th>
                    <th>Assignee</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentsQuery.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/incidents/${item.id}`}>{item.id}</Link>
                      </td>
                      <td>{item.title}</td>
                      <td>{item.severity}</td>
                      <td>{item.priority}</td>
                      <td>{item.status}</td>
                      <td>{item.team}</td>
                      <td>{item.assignee}</td>
                      <td>{new Date(item.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="table-footer">
              <p>
                Total: <strong>{incidentsQuery.data.total}</strong>
              </p>
              <div className="pagination">
                <button
                  className="btn ghost"
                  type="button"
                  disabled={!canGoPrev}
                  onClick={() => setPage(filters.page - 1)}
                >
                  Prev
                </button>
                <span>
                  Page {filters.page} / {totalPages}
                </span>
                <button
                  className="btn ghost"
                  type="button"
                  disabled={!canGoNext}
                  onClick={() => setPage(filters.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
