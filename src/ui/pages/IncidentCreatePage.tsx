import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { createIncident, getIncidentFormOptions } from "../../api/incidents";
import { useAuthStore } from "../../state/authStore";
import {
  INCIDENT_FORM_DEFAULT_VALUES,
  IncidentFormValues,
  incidentFormSchema,
} from "../forms/incidentFormSchema";

export function IncidentCreatePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userName = useAuthStore((state) => state.userName) ?? "Unknown user";

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: INCIDENT_FORM_DEFAULT_VALUES,
  });

  const optionsQuery = useQuery({
    queryKey: ["incident-form-options"],
    queryFn: getIncidentFormOptions,
  });

  const createMutation = useMutation({
    mutationFn: createIncident,
    onSuccess: async (createdIncident) => {
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate(`/incidents/${createdIncident.id}`);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    createMutation.mutate({
      ...values,
      actorName: userName,
    });
  });

  const errors = form.formState.errors;

  return (
    <div className="page">
      <h1>Create Incident</h1>
      <p>Production-like form with schema validation and mutation flow.</p>

      <form className="card form-grid" onSubmit={onSubmit}>
        <label className="field">
          <span>Title</span>
          <input className="input" {...form.register("title")} />
          {errors.title && <span className="field-error">{errors.title.message}</span>}
        </label>

        <label className="field">
          <span>Description</span>
          <textarea className="textarea" {...form.register("description")} />
          {errors.description && (
            <span className="field-error">{errors.description.message}</span>
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
            {errors.team && <span className="field-error">{errors.team.message}</span>}
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
            {errors.assignee && <span className="field-error">{errors.assignee.message}</span>}
          </label>
        </div>

        {createMutation.isError && (
          <p className="error-text">{(createMutation.error as Error).message}</p>
        )}

        <div className="actions-row">
          <button className="btn" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create incident"}
          </button>
        </div>
      </form>
    </div>
  );
}
