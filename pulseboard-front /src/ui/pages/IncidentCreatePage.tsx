import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { createIncident, getIncidentFormOptions } from "../../api/incidents";
import { useI18n } from "../../i18n/useI18n";
import { useAuthStore } from "../../state/authStore";
import { useToastStore } from "../../state/toastStore";
import {
  INCIDENT_FORM_DEFAULT_VALUES,
  IncidentFormValues,
  createIncidentFormSchema,
} from "../forms/incidentFormSchema";

const REALISTIC_TEMPLATES = [
  {
    title: "Сбой платежного шлюза СБП на кассах самообслуживания",
    description: "Покупатели жалуются на ошибки 504 при попытке оплаты по QR-коду. Очереди на кассах растут. Требуется перезагрузка инстанса авторизации.",
    severity: "critical" as const,
    priority: "p1" as const,
  },
  {
    title: "Отказ сканеров штрих-кодов в зоне сортировки А-3",
    description: "После обновления прошивки ТСД не могут подключиться к внутренней Wi-Fi сети склада. Зависла отгрузка 14 фур.",
    severity: "high" as const,
    priority: "p2" as const,
  },
  {
    title: "Аварийное падение давления в контуре охлаждения серверной №2",
    description: "Датчики зафиксировали утечку хладагента в главном чиллере. Температура в стойках растет, кондиционирование работает на резервных мощностях.",
    severity: "high" as const,
    priority: "p1" as const,
  },
  {
    title: "Плановое обновление сертификатов безопасности веб-портала",
    description: "Необходимо обновить SSL-сертификаты для внешних доменов. Работы согласованы в технологическое окно с минимальной нагрузкой.",
    severity: "low" as const,
    priority: "p4" as const,
  }
];

export function IncidentCreatePage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userName = useAuthStore((state) => state.userName) ?? "Unknown user";
  const pushToast = useToastStore((state) => state.pushToast);
  const incidentFormSchema = createIncidentFormSchema(t);

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
      pushToast({ kind: "success", message: t("toastIncidentCreated") });
      navigate(`/incidents/${createdIncident.id}`);
    },
    onError: (error) => {
      pushToast({ kind: "error", message: (error as Error).message });
    },
  });

  const handleApplyTemplate = () => {
    const randomIndex = Math.floor(Math.random() * REALISTIC_TEMPLATES.length);
    const template = REALISTIC_TEMPLATES[randomIndex];

    const availableTeams = optionsQuery.data?.teams ?? [];
    const availableAssignees = optionsQuery.data?.assignees ?? [];

    form.reset({
      title: template.title,
      description: template.description,
      severity: template.severity,
      priority: template.priority,
      team: availableTeams[randomIndex % availableTeams.length] ?? "",
      assignee: availableAssignees[randomIndex % availableAssignees.length] ?? "",
    });

    pushToast({ kind: "success", message: "Тестовый шаблон успешно заполнен!" });
  };

  const onSubmit = form.handleSubmit((values) => {
    createMutation.mutate({
      ...values,
      actorName: userName,
    });
  });

  const errors = form.formState.errors;

  return (
    <div className="page">
      <div className="actions-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>{t("createTitle")}</h1>
          <p>{t("createSubtitle")}</p>
        </div>
        <button
          className="btn ghost"
          type="button"
          disabled={optionsQuery.isLoading}
          onClick={handleApplyTemplate}
          style={{ whiteSpace: "nowrap" }}
        >
          ⚡ Заполнить шаблон
        </button>
      </div>

      <form className="card form-grid" onSubmit={onSubmit}>
        {optionsQuery.isLoading && <p className="muted-text">{t("formLoadingOptions")}</p>}
        <label className="field">
          <span>{t("formTitle")}</span>
          <input className="input" {...form.register("title")} />
          {errors.title && <span className="field-error">{errors.title.message}</span>}
        </label>

        <label className="field">
          <span>{t("formDescription")}</span>
          <textarea className="textarea" {...form.register("description")} />
          {errors.description && (
            <span className="field-error">{errors.description.message}</span>
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
            {errors.team && <span className="field-error">{errors.team.message}</span>}
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
            {errors.assignee && <span className="field-error">{errors.assignee.message}</span>}
          </label>
        </div>

        {createMutation.isError && (
          <p className="error-text">{(createMutation.error as Error).message}</p>
        )}

        <div className="actions-row">
          <button
            className="btn"
            type="submit"
            disabled={createMutation.isPending || optionsQuery.isLoading}
          >
            {createMutation.isPending ? t("creatingButton") : t("createButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
