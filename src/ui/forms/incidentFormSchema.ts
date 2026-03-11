import { z } from "zod";
import { translations, TranslationKey } from "../../i18n/translations";

type TranslateFn = (key: TranslationKey) => string;

const fallbackTranslate: TranslateFn = (key) => translations.en[key];

export function createIncidentFormSchema(t: TranslateFn = fallbackTranslate) {
  return z.object({
    title: z.string().trim().min(5, t("validationTitleMin")).max(120),
    description: z
      .string()
      .trim()
      .min(20, t("validationDescriptionMin"))
      .max(2000, t("validationDescriptionMax")),
    severity: z.enum(["low", "medium", "high", "critical"]),
    priority: z.enum(["p1", "p2", "p3", "p4"]),
    team: z.string().min(1, t("validationTeamRequired")),
    assignee: z.string().min(1, t("validationAssigneeRequired")),
  });
}

export const incidentFormSchema = createIncidentFormSchema();

export type IncidentFormValues = z.infer<typeof incidentFormSchema>;

export const INCIDENT_FORM_DEFAULT_VALUES: IncidentFormValues = {
  title: "",
  description: "",
  severity: "medium",
  priority: "p2",
  team: "",
  assignee: "",
};
