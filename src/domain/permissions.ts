import { AppRole, IncidentStatus } from "./incidents";

export const INCIDENT_EDITOR_ROLES: AppRole[] = ["operator", "admin"];

export function canCreateIncident(role: AppRole | null): boolean {
  return role !== null && INCIDENT_EDITOR_ROLES.includes(role);
}

export function canEditIncident(role: AppRole | null): boolean {
  return role !== null && INCIDENT_EDITOR_ROLES.includes(role);
}

export function canAddComment(role: AppRole | null): boolean {
  return role !== "viewer" && role !== null;
}

export function canDeleteComment(role: AppRole | null): boolean {
  return role === "admin";
}

export function getAllowedStatusTransitions(status: IncidentStatus, role: AppRole): IncidentStatus[] {
  const common: Record<IncidentStatus, IncidentStatus[]> = {
    open: ["in_progress", "resolved"],
    in_progress: ["resolved"],
    resolved: ["closed", "in_progress"],
    closed: [],
  };

  if (status === "closed" && role === "admin") {
    return ["in_progress"];
  }

  return common[status];
}

