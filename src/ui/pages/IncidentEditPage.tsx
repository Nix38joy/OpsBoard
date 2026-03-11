import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getIncidentDetails, getIncidentFormOptions, updateIncident } from "../../api/incidents";
import { useI18n } from "../../i18n/useI18n";
import { useAuthStore } from "../../state/authStore";
import { createIncidentFormSchema, IncidentFormValues } from "../forms/incidentFormSchema";

export function IncidentEditPage() {
  const { t } = useI18n();
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role) ?? "viewer";
  const userName = useAuthStore((state) => state.userName) ?? "Unknown user";
  const incidentFormSchema = createIncidentFormSchema(t);

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
    return <p className="error-text">{t("detailsInvalidId")}</p>;
  }

  return (
    <div className="page">
      <h1>{t("editTitle")}</h1>
      <p>
        {t("editSubtitle", { id: incidentId })}
      </p>

      {detailsQuery.isLoading && <p>{t("editLoading")}</p>}
      {detailsQuery.isError && (
        <p className="error-text">{t("editLoadError")}</p>
      )}
      {!detailsQuery.isLoading && !detailsQuery.isError && detailsQuery.data && (
        <form className="card form-grid" onSubmit={onSubmit}>
          {optionsQuery.isLoading && <p className="muted-text">{t("formLoadingOptions")}</p>}
          <label className="field">
            <span>{t("formTitle")}</span>
            <input className="input" {...form.register("title")} />
            {form.formState.errors.title && (
              <span className="field-error">{form.formState.errors.title.message}</span>
            )}
          </label>

          <label className="field">
            <span>{t("formDescription")}</span>
            <textarea className="textarea" {...form.register("description")} />
            {form.formState.errors.description && (
              <span className="field-error">{form.formState.errors.description.message}</span>
            )}
          </label>

          <div className="form-row">
            <label className="field">
              <span>{t("formSeverity")}</span>
              <select className="input" {...form.register("severity")}>
                <option value="low">{t("severityLow")}</option>
                <option value="medium">{t("severityMedium")}</option>
                <option value="high">{t("severityHigh")}</option>
                <option value="critical">{t("severityCritical")}</option>
              </select>
            </label>

            <label className="field">
              <span>{t("formPriority")}</span>
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
              <span>{t("formTeam")}</span>
              <select className="input" {...form.register("team")} disabled={optionsQuery.isLoading}>
                <option value="">{t("formSelectTeam")}</option>
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
              <span>{t("formAssignee")}</span>
              <select
                className="input"
                {...form.register("assignee")}
                disabled={optionsQuery.isLoading}
              >
                <option value="">{t("formSelectAssignee")}</option>
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
            <button
              className="btn"
              type="submit"
              disabled={editMutation.isPending || optionsQuery.isLoading}
            >
              {editMutation.isPending ? t("editSaving") : t("editSave")}
            </button>
            <Link className="btn ghost" to={`/incidents/${incidentId}`}>
              {t("editCancel")}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
