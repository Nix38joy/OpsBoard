import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getIncidentDetails, getIncidentFormOptions, updateIncident } from "../../api/incidents";
import { useAuthStore } from "../../state/authStore";
import { IncidentFormValues, incidentFormSchema } from "../forms/incidentFormSchema";

export function IncidentEditPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role) ?? "viewer";
  const userName = useAuthStore((state) => state.userName) ?? "Unknown user";

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
  });

  const detailsQuery = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => getIncidentDetails(incidentId ?? ""),
    enabled: Boolean(incidentId),
  });

  const optionsQuery = useQuery({
    queryKey: ["incident-form-options"],
    queryFn: getIncidentFormOptions,
  });

  useEffect(() => {
    if (detailsQuery.data?.incident) {
      const incident = detailsQuery.data.incident;
      form.reset({
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        priority: incident.priority,
        team: incident.team,
        assignee: incident.assignee,
      });
    }
  }, [detailsQuery.data?.incident, form]);

  const editMutation = useMutation({
    mutationFn: (values: IncidentFormValues) =>
      updateIncident({
        incidentId: incidentId ?? "",
        role,
        actorName: userName,
        ...values,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate(`/incidents/${incidentId}`);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    editMutation.mutate(values);
  });

  if (!incidentId) {
    return <p className="error-text">Invalid incident id.</p>;
  }

  return (
    <div className="page">
      <h1>Edit Incident</h1>
      <p>
        Update fields for incident <strong>{incidentId}</strong>.
      </p>

      {detailsQuery.isLoading && <p>Loading incident data...</p>}
      {detailsQuery.isError && (
        <p className="error-text">Could not load incident for editing. Try again later.</p>
      )}
      {!detailsQuery.isLoading && !detailsQuery.isError && detailsQuery.data && (
        <form className="card form-grid" onSubmit={onSubmit}>
          <label className="field">
            <span>Title</span>
            <input className="input" {...form.register("title")} />
            {form.formState.errors.title && (
              <span className="field-error">{form.formState.errors.title.message}</span>
            )}
          </label>

          <label className="field">
            <span>Description</span>
            <textarea className="textarea" {...form.register("description")} />
            {form.formState.errors.description && (
              <span className="field-error">{form.formState.errors.description.message}</span>
            )}
          </label>

          <div className="form-row">
            <label className="field">
              <span>Severity</span>
              <select className="input" {...form.register("severity")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label className="field">
              <span>Priority</span>
              <select className="input" {...form.register("priority")}>
                <option value="p1">P1</option>
                <option value="p2">P2</option>
                <option value="p3">P3</option>
                <option value="p4">P4</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>Team</span>
              <select className="input" {...form.register("team")} disabled={optionsQuery.isLoading}>
                <option value="">Select team</option>
                {(optionsQuery.data?.teams ?? []).map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
              {form.formState.errors.team && (
                <span className="field-error">{form.formState.errors.team.message}</span>
              )}
            </label>

            <label className="field">
              <span>Assignee</span>
              <select
                className="input"
                {...form.register("assignee")}
                disabled={optionsQuery.isLoading}
              >
                <option value="">Select assignee</option>
                {(optionsQuery.data?.assignees ?? []).map((assignee) => (
                  <option key={assignee} value={assignee}>
                    {assignee}
                  </option>
                ))}
              </select>
              {form.formState.errors.assignee && (
                <span className="field-error">{form.formState.errors.assignee.message}</span>
              )}
            </label>
          </div>

          {editMutation.isError && <p className="error-text">{(editMutation.error as Error).message}</p>}
          <div className="actions-row">
            <button className="btn" type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? "Saving..." : "Save changes"}
            </button>
            <Link className="btn ghost" to={`/incidents/${incidentId}`}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
