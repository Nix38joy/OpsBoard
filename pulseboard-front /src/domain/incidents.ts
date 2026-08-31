export type IncidentStatus = "open" | "in_progress" | "resolved" | "closed";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentPriority = "p1" | "p2" | "p3" | "p4";
export type AppRole = "viewer" | "operator" | "admin";

export type Incident = {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  priority: IncidentPriority;
  status: IncidentStatus;
  team: string;
  assignee: string;
  updatedAt: string;
};

export type IncidentComment = {
  id: string;
  incidentId: string;
  authorName: string;
  message: string;
  createdAt: string;
};

export type IncidentEvent = {
  id: string;
  incidentId: string;
  message: string;
  createdAt: string;
};

export type IncidentLastStatusChange = {
  previousStatus: IncidentStatus;
  nextStatus: IncidentStatus;
  changedAt: string;
  actorName: string;
};

export type IncidentDetails = {
  incident: Incident;
  comments: IncidentComment[];
  events: IncidentEvent[];
  lastStatusChange?: IncidentLastStatusChange | null;
  statusUndoRemainingMs?: number | null;
};

export type IncidentsFilters = {
  search: string;
  status: "all" | IncidentStatus;
  severity: "all" | IncidentSeverity;
  sla: "all" | "at_risk" | "breached";
  overdueOnly: boolean;
  page: number;
  pageSize: number;
};

export type IncidentsListResponse = {
  items: Incident[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type DashboardMetric = {
  id:
    | "open"
    | "overdue"
    | "resolved7d"
    | "criticalActive"
    | "slaBreachedActive"
    | "slaAtRiskActive";
  label: string;
  value: number;
  description: string;
  to: string;
};
