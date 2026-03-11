import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addIncidentComment,
  deleteIncidentComment,
  getIncidentDetails,
  getStatusTransitions,
  undoIncidentStatusChange,
  updateIncidentStatus,
} from "../../api/incidents";
import { IncidentStatus } from "../../domain/incidents";
import { LIVE_REFRESH_INTERVAL_MS } from "../../domain/liveUpdates";
import { canAddComment, canDeleteComment, canEditIncident } from "../../domain/permissions";
import { useAuthStore } from "../../state/authStore";
import { useUiSettingsStore } from "../../state/uiSettingsStore";

export function IncidentDetailsPage() {
  const { incidentId } = useParams();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role);
  const userName = useAuthStore((state) => state.userName);
  const autoRefreshEnabled = useUiSettingsStore((state) => state.autoRefreshEnabled);
  const [commentDraft, setCommentDraft] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

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

  const onCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commentMutation.mutate(commentDraft);
  };
  const isAnyActionPending =
    statusMutation.isPending ||
    undoStatusMutation.isPending ||
    commentMutation.isPending ||
    deleteCommentMutation.isPending;

  if (!incidentId) {
    return (
      <div className="page">
        <p className="error-text">Invalid incident id.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Incident Details</h1>
      <p>
        Incident ID: <strong>{incidentId}</strong>
      </p>
      <p className="muted-text">
        {autoRefreshEnabled ? "Live updates every 15 seconds." : "Live updates are paused."}
      </p>

      {detailsQuery.isLoading && <p>Loading incident details...</p>}
      {detailsQuery.isFetching && !detailsQuery.isLoading && (
        <p className="muted-text">Refreshing incident data...</p>
      )}
      {detailsQuery.isError && (
        <p className="error-text">Could not load details. Please go back and try again.</p>
      )}
      {!detailsQuery.isLoading && !detailsQuery.isError && detailsQuery.data && (
        <>
          {actionError && <p className="error-text">{actionError}</p>}
          <section className="card details-grid">
            <div>
              <p>
                <strong>Title:</strong> {detailsQuery.data.incident.title}
              </p>
              <p>
                <strong>Status:</strong> {detailsQuery.data.incident.status}
              </p>
              <p>
                <strong>Severity:</strong> {detailsQuery.data.incident.severity}
              </p>
              <p>
                <strong>Priority:</strong> {detailsQuery.data.incident.priority}
              </p>
            </div>
            <div>
              <p>
                <strong>Team:</strong> {detailsQuery.data.incident.team}
              </p>
              <p>
                <strong>Assignee:</strong> {detailsQuery.data.incident.assignee}
              </p>
              <p>
                <strong>Updated:</strong>{" "}
                {new Date(detailsQuery.data.incident.updatedAt).toLocaleString()}
              </p>
            </div>
          </section>

          <section className="card section-gap">
            <h2>Description</h2>
            <p>{detailsQuery.data.incident.description}</p>
            {canEditIncident(role) && (
              <Link className="btn ghost section-link" to={`/incidents/${incidentId}/edit`}>
                Edit incident
              </Link>
            )}
          </section>

          <section className="card section-gap">
            <h2>Status actions</h2>
            <p>Allowed transitions for role: {role}</p>
            <div className="actions-row">
              {allowedTransitions.length === 0 && <p>No status actions available.</p>}
              {allowedTransitions.map((status) => (
                <button
                  key={status}
                  className="btn"
                  type="button"
                  disabled={isAnyActionPending}
                  onClick={() => statusMutation.mutate(status)}
                >
                  {statusMutation.isPending ? "Updating..." : `Set ${status}`}
                </button>
              ))}
              {canEditIncident(role) &&
                detailsQuery.data.statusUndoRemainingMs &&
                detailsQuery.data.statusUndoRemainingMs > 0 && (
                  <button
                    className="btn ghost"
                    type="button"
                    disabled={isAnyActionPending}
                    onClick={() => undoStatusMutation.mutate()}
                  >
                    {undoStatusMutation.isPending
                      ? "Undoing..."
                      : `Undo last change (${Math.ceil(detailsQuery.data.statusUndoRemainingMs / 1000)}s)`}
                  </button>
                )}
            </div>
          </section>

          <section className="card section-gap">
            <h2>Comments</h2>
            <form onSubmit={onCommentSubmit}>
              <textarea
                className="textarea"
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Write a comment (for operator/admin)"
                disabled={!canAddComment(role) || isAnyActionPending}
              />
              <button
                className="btn"
                type="submit"
                disabled={!canAddComment(role) || isAnyActionPending}
              >
                {commentMutation.isPending ? "Sending..." : "Add comment"}
              </button>
            </form>
            {!canAddComment(role) && <p className="muted-text">Viewer role can only read comments.</p>}
            {detailsQuery.data.comments.length === 0 ? (
              <p>No comments yet.</p>
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
                        {deleteCommentMutation.isPending ? "Deleting..." : "Delete comment"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card section-gap">
            <h2>Timeline</h2>
            {detailsQuery.data.events.length === 0 ? (
              <p>No events yet.</p>
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

      <Link className="btn ghost" to="/incidents">
        Back to incidents
      </Link>
    </div>
  );
}
