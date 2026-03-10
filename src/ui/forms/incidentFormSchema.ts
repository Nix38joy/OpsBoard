import { z } from "zod";

export const incidentFormSchema = z.object({
  title: z.string().trim().min(5, "Title must contain at least 5 characters.").max(120),
  description: z
    .string()
    .trim()
    .min(20, "Description must contain at least 20 characters.")
    .max(2000, "Description is too long."),
  severity: z.enum(["low", "medium", "high", "critical"]),
  priority: z.enum(["p1", "p2", "p3", "p4"]),
  team: z.string().min(1, "Team is required."),
  assignee: z.string().min(1, "Assignee is required."),
});

export type IncidentFormValues = z.infer<typeof incidentFormSchema>;

export const INCIDENT_FORM_DEFAULT_VALUES: IncidentFormValues = {
  title: "",
  description: "",
  severity: "medium",
  priority: "p2",
  team: "",
  assignee: "",
};
