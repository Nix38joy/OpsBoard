import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addIncidentComment,
  deleteIncident,
  deleteIncidentComment,
  getIncidentDetails,
  getStatusTransitions,
  undoIncidentStatusChange,
  updateIncidentStatus,
} from "../../api/incidents";
import { IncidentStatus } from "../../domain/incidents";
import { useI18n } from "../../i18n/useI18n";
import { LIVE_REFRESH_INTERVAL_MS } from "../../domain/liveUpdates";
import { formatSlaRemaining, getIncidentSla } from "../../domain/sla";
import {
  canAddComment,
  canDeleteComment,
  canDeleteIncident,
  canEditIncident,
} from "../../domain/permissions";
import { useAuthStore } from "../../state/authStore";
import { useUiSettingsStore } from "../../state/uiSettingsStore";

export function IncidentDetailsPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role);
  const userName = useAuthStore((state) => state.userName);
  const autoRefreshEnabled = useUiSettingsStore((state) => state.autoRefreshEnabled);
  const { t } = useI18n();
  const [commentDraft, setCommentDraft] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [undoDeadlineMs, setUndoDeadlineMs] = useState<number | null>(null);
  const [undoNowMs, setUndoNowMs] = useState<number>(Date.now());

  const detailsQuery = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => getIncidentDetails(incidentId ?? ""),
    enabled: Boolean(incidentId),
    refetchInterval: autoRefreshEnabled ? LIVE_REFRESH_INTERVAL_MS : false,
  });

  const allowedTransitions = useMemo(() => {
    if (!detailsQuery.data?.incident || !role) {
      return [] as IncidentStatus[];
    }
    return getStatusTransitions(detailsQuery.data.incident.status, role);
  }, [detailsQuery.data?.incident, role]);

  const statusLabelByValue: Record<IncidentStatus, string> = {
    open: t("statusOpen"),
    in_progress: t("statusInProgress"),
    resolved: t("statusResolved"),
    closed: t("statusClosed"),
  };
  const severityLabelByValue: Record<
    "low" | "medium" | "high" | "critical",
    string
  > = {
    low: t("severityLow"),
    medium: t("severityMedium"),
    high: t("severityHigh"),
    critical: t("severityCritical"),
  };
  const incidentSla = detailsQuery.data?.incident ? getIncidentSla(detailsQuery.data.incident) : null;

  const undoRemainingMs = useMemo(() => {
    if (!undoDeadlineMs) {
      return null;
    }
    return Math.max(0, undoDeadlineMs - undoNowMs);
  }, [undoDeadlineMs, undoNowMs]);

  useEffect(() => {
    const remaining = detailsQuery.data?.statusUndoRemainingMs ?? null;
    if (!remaining || remaining <= 0) {
      setUndoDeadlineMs(null);
      return;
    }
    setUndoNowMs(Date.now());
    setUndoDeadlineMs(Date.now() + remaining);
  }, [detailsQuery.data?.statusUndoRemainingMs]);

  useEffect(() => {
    if (!undoDeadlineMs) {
      return;
    }

    const timer = window.setInterval(() => {
      const now = Date.now();
      setUndoNowMs(now);
      if (undoDeadlineMs - now <= 0) {
        setUndoDeadlineMs(null);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [undoDeadlineMs]);

  const statusMutation = useMutation({
    mutationFn: (nextStatus: IncidentStatus) =>
      updateIncidentStatus({
        incidentId: incidentId ?? "",
        nextStatus,
        role: role ?? "viewer",
        actorName: userName ?? "Unknown user",
      }),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      setActionError((error as Error).message);
    },
  });

  const undoStatusMutation = useMutation({
    mutationFn: () =>
      undoIncidentStatusChange({
        incidentId: incidentId ?? "",
        role: role ?? "viewer",
        actorName: userName ?? "Unknown user",
      }),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      setActionError((error as Error).message);
    },
  });

  const commentMutation = useMutation({
    mutationFn: (message: string) =>
      addIncidentComment({
        incidentId: incidentId ?? "",
        role: role ?? "viewer",
        authorName: userName ?? "Unknown user",
        message,
      }),
    onSuccess: async () => {
      setCommentDraft("");
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
    },
    onError: (error) => {
      setActionError((error as Error).message);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      deleteIncidentComment({
        incidentId: incidentId ?? "",
        commentId,
        role: role ?? "viewer",
        actorName: userName ?? "Unknown user",
      }),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
    },
    onError: (error) => {
      setActionError((error as Error).message);
    },
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: () =>
      deleteIncident({
        incidentId: incidentId ?? "",
        role: role ?? "viewer",
        actorName: userName ?? "Unknown user",
      }),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/incidents");
    },
    onError: (error) => {
      setActionError((error as Error).message);
    },
  });

  const onCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commentMutation.mutate(commentDraft);
  };
  const isAnyActionPending =
    statusMutation.isPending ||
    undoStatusMutation.isPending ||
    commentMutation.isPending ||
    deleteCommentMutation.isPending ||
    deleteIncidentMutation.isPending;

  const handleDeleteIncident = () => {
    const confirmed = window.confirm(
      t("detailsDeleteConfirm"),
    );
    if (!confirmed) {
      return;
    }
    deleteIncidentMutation.mutate();
  };

  if (!incidentId) {
    return (
      <div className="page">
        <p className="error-text">{t("detailsInvalidId")}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{t("detailsTitle")}</h1>
      <p>
        {t("detailsIncidentId")}: <strong>{incidentId}</strong>
      </p>
      <p className="muted-text">
        {autoRefreshEnabled ? t("commonLiveUpdatesOn") : t("commonLiveUpdatesOff")}
      </p>
      <div className="actions-row">
        <button
          className="btn ghost"
          type="button"
          onClick={() => void detailsQuery.refetch()}
          disabled={detailsQuery.isFetching}
        >
          {detailsQuery.isFetching ? t("commonRefreshing") : t("commonRefreshNow")}
        </button>
      </div>

      {detailsQuery.isLoading && <p>{t("detailsLoading")}</p>}
      {detailsQuery.isFetching && !detailsQuery.isLoading && (
        <p className="muted-text">{t("detailsRefreshing")}</p>
      )}
      {detailsQuery.isError && (
        <p className="error-text">{t("detailsLoadError")}</p>
      )}
      {!detailsQuery.isLoading && !detailsQuery.isError && detailsQuery.data && (
        <>
          {actionError && <p className="error-text">{actionError}</p>}
          <section className="card details-grid">
            <div>
              <p>
                <strong>{t("formTitle")}:</strong> {detailsQuery.data.incident.title}
              </p>
              <p>
                <strong>{t("incidentsStatus")}:</strong>{" "}
                {statusLabelByValue[detailsQuery.data.incident.status]}
              </p>
              <p>
                <strong>{t("incidentsSeverity")}:</strong>{" "}
                {severityLabelByValue[detailsQuery.data.incident.severity]}
              </p>
              <p>
                <strong>{t("formPriority")}:</strong> {detailsQuery.data.incident.priority}
              </p>
            </div>
            <div>
              <p>
                <strong>{t("incidentsTableTeam")}:</strong> {detailsQuery.data.incident.team}
              </p>
              <p>
                <strong>{t("incidentsTableAssignee")}:</strong> {detailsQuery.data.incident.assignee}
              </p>
              <p>
                <strong>{t("incidentsTableUpdated")}:</strong>{" "}
                {new Date(detailsQuery.data.incident.updatedAt).toLocaleString()}
              </p>
              <p>
                <strong>{t("detailsSla")}:</strong>{" "}
                {!incidentSla || !incidentSla.isTracked ? (
                  <span className="muted-text">{t("slaNotTracked")}</span>
                ) : incidentSla.isBreached ? (
                  <span className="pill pill-sla-breached">{t("slaBreached")}</span>
                ) : (
                  <span className="pill pill-sla-ok">
                    {t("slaIn", { time: formatSlaRemaining(incidentSla.remainingMs ?? 0) })}
                  </span>
                )}
              </p>
            </div>
          </section>

          <section className="card section-gap">
            <h2>{t("detailsSectionDescription")}</h2>
            <p>{detailsQuery.data.incident.description}</p>
            <div className="actions-row section-link-row">
              {canEditIncident(role) && (
                <Link className="btn ghost" to={`/incidents/${incidentId}/edit`}>
                  {t("detailsEditIncident")}
                </Link>
              )}
              {canDeleteIncident(role) && (
                <button
                  className="btn danger"
                  type="button"
                  disabled={isAnyActionPending}
                  onClick={handleDeleteIncident}
                >
                  {deleteIncidentMutation.isPending
                    ? t("detailsDeletingIncident")
                    : t("detailsDeleteIncident")}
                </button>
              )}
            </div>
          </section>

          <section className="card section-gap">
            <h2>{t("detailsSectionStatusActions")}</h2>
            <p>
              {t("detailsAllowedTransitions")}: {role}
            </p>
            {detailsQuery.data.lastStatusChange && (
              <p className="muted-text">
                {t("detailsLastChange", {
                  actor: detailsQuery.data.lastStatusChange.actorName,
                  from: statusLabelByValue[detailsQuery.data.lastStatusChange.previousStatus],
                  to: statusLabelByValue[detailsQuery.data.lastStatusChange.nextStatus],
                })}
              </p>
            )}
            <div className="actions-row">
              {allowedTransitions.length === 0 && <p>{t("detailsNoStatusActions")}</p>}
              {allowedTransitions.map((status) => (
                <button
                  key={status}
                  className="btn"
                  type="button"
                  disabled={isAnyActionPending}
                  onClick={() => statusMutation.mutate(status)}
                >
                  {statusMutation.isPending
                    ? t("detailsUpdatingStatus")
                    : `${t("detailsSetStatus")} ${statusLabelByValue[status]}`}
                </button>
              ))}
              {canEditIncident(role) &&
                undoRemainingMs &&
                undoRemainingMs > 0 && (
                  <button
                    className="btn ghost"
                    type="button"
                    disabled={isAnyActionPending}
                    onClick={() => undoStatusMutation.mutate()}
                  >
                    {undoStatusMutation.isPending
                      ? t("detailsUndoing")
                      : t("detailsUndoLastChange", {
                          seconds: Math.ceil(undoRemainingMs / 1000),
                        })}
                  </button>
                )}
            </div>
          </section>

          <section className="card section-gap">
            <h2>{t("detailsSectionComments")}</h2>
            <form onSubmit={onCommentSubmit}>
              <textarea
                className="textarea"
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder={t("detailsCommentPlaceholder")}
                disabled={!canAddComment(role) || isAnyActionPending}
              />
              <button
                className="btn"
                type="submit"
                disabled={!canAddComment(role) || isAnyActionPending}
              >
                {commentMutation.isPending ? t("detailsSendingComment") : t("detailsAddComment")}
              </button>
            </form>
            {!canAddComment(role) && <p className="muted-text">{t("detailsViewerReadOnly")}</p>}
            {detailsQuery.data.comments.length === 0 ? (
              <p>{t("detailsNoComments")}</p>
            ) : (
              <ul className="stack-list">
                {detailsQuery.data.comments.map((comment) => (
                  <li key={comment.id} className="card stack-item">
                    <p>
                      <strong>{comment.authorName}</strong> -{" "}
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                    <p>{comment.message}</p>
                    {canDeleteComment(role) && (
                      <button
                        className="btn danger"
                        type="button"
                        disabled={isAnyActionPending}
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                      >
                        {deleteCommentMutation.isPending
                          ? t("detailsDeletingComment")
                          : t("detailsDeleteComment")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card section-gap">
            <h2>{t("detailsSectionTimeline")}</h2>
            {detailsQuery.data.events.length === 0 ? (
              <p>{t("detailsNoEvents")}</p>
            ) : (
              <ul className="stack-list">
                {detailsQuery.data.events.map((event) => (
                  <li key={event.id} className="stack-item">
                    <p>{event.message}</p>
                    <small>{new Date(event.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <Link className="btn ghost page-bottom-action" to="/incidents">
        {t("detailsBackToIncidents")}
      </Link>
    </div>
  );
}
