import {
  AppRole,
  Incident,
  IncidentComment,
  IncidentDetails,
  IncidentEvent,
  IncidentsFilters,
  IncidentsListResponse,
  DashboardMetric,
  IncidentPriority,
  IncidentSeverity,
  IncidentLastStatusChange,
  IncidentStatus,
} from "../domain/incidents";
import { getIncidentSla } from "../domain/sla";
import {
  canAddComment,
  canDeleteComment,
  canDeleteIncident,
  canEditIncident,
  getAllowedStatusTransitions,
} from "../domain/permissions";

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-1201",
    title: "Payments queue delay in EU region",
    description: "Transactions are stuck in processing for around 12 minutes in EU zone.",
    severity: "high",
    priority: "p1",
    status: "in_progress",
    team: "Payments",
    assignee: "Ilya Petrov",
    updatedAt: "2026-03-10T08:20:00.000Z",
  },
  {
    id: "INC-1202",
    title: "Warehouse sync timeout at midnight batch",
    description: "Sync job does not complete within expected SLA and retries three times.",
    severity: "medium",
    priority: "p2",
    status: "open",
    team: "Logistics",
    assignee: "Nina Smirnova",
    updatedAt: "2026-03-10T09:15:00.000Z",
  },
  {
    id: "INC-1203",
    title: "Invoice export returns 502 for large reports",
    description: "Users report export failures for reports with more than 20k rows.",
    severity: "critical",
    priority: "p1",
    status: "open",
    team: "Billing",
    assignee: "Maksim Orlov",
    updatedAt: "2026-03-09T19:40:00.000Z",
  },
  {
    id: "INC-1204",
    title: "Email notifications are delayed for 30 minutes",
    description: "Notification queue latency spikes during peak traffic periods.",
    severity: "low",
    priority: "p4",
    status: "resolved",
    team: "Platform",
    assignee: "Alina Romanova",
    updatedAt: "2026-03-08T12:05:00.000Z",
  },
  {
    id: "INC-1205",
    title: "SLA clock is not visible in incident details",
    description: "SLA countdown chip is hidden when browser zoom is set above 110 percent.",
    severity: "medium",
    priority: "p3",
    status: "closed",
    team: "Ops UI",
    assignee: "Kirill Andreev",
    updatedAt: "2026-03-07T14:11:00.000Z",
  },
  {
    id: "INC-1206",
    title: "Rate limiter triggers false positives on API gateway",
    description: "Gateway rejects safe traffic bursts from internal dashboard sync workers.",
    severity: "high",
    priority: "p1",
    status: "in_progress",
    team: "Core API",
    assignee: "Pavel Kozlov",
    updatedAt: "2026-03-10T07:01:00.000Z",
  },
  {
    id: "INC-1207",
    title: "Admin audit page freezes on big account list",
    description: "The audit list becomes unresponsive after applying two filters together.",
    severity: "high",
    priority: "p2",
    status: "open",
    team: "Ops UI",
    assignee: "Daria Melnik",
    updatedAt: "2026-03-09T16:32:00.000Z",
  },
  {
    id: "INC-1208",
    title: "Data import retries exceed expected thresholds",
    description: "Import worker loops on malformed CSV rows and retries above configured limits.",
    severity: "critical",
    priority: "p1",
    status: "in_progress",
    team: "Data Platform",
    assignee: "Roman Sokolov",
    updatedAt: "2026-03-10T09:52:00.000Z",
  },
];

const STORAGE_KEY = "opsboard.incidents.storage.v1";
const STORAGE_VERSION = 1;
export const STATUS_UNDO_WINDOW_MS = 30_000;

type PersistedIncidentsData = {
  incidents: Incident[];
  commentsByIncidentId: Record<string, IncidentComment[]>;
  eventsByIncidentId: Record<string, IncidentEvent[]>;
  lastStatusChangeByIncidentId: Record<string, IncidentLastStatusChange>;
  counters: {
    incidentCounter: number;
    commentCounter: number;
    eventCounter: number;
  };
};

type PersistedIncidentsEnvelope = {
  version: number;
  data: PersistedIncidentsData;
};

let incidentsDb: Incident[] = [];
let commentsDb = new Map<string, IncidentComment[]>();
let eventsDb = new Map<string, IncidentEvent[]>();
let lastStatusChangeDb = new Map<string, IncidentLastStatusChange>();
let commentCounter = 4000;
let eventCounter = 7000;
let incidentCounter = 1300;

const TEAM_OPTIONS = [
  "Payments",
  "Logistics",
  "Billing",
  "Platform",
  "Ops UI",
  "Core API",
  "Data Platform",
] as const;

const ASSIGNEE_OPTIONS = [
  "Ilya Petrov",
  "Nina Smirnova",
  "Maksim Orlov",
  "Alina Romanova",
  "Kirill Andreev",
  "Pavel Kozlov",
  "Daria Melnik",
  "Roman Sokolov",
] as const;

function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function createDefaultData(): PersistedIncidentsData {
  const commentsByIncidentId: Record<string, IncidentComment[]> = {};
  const eventsByIncidentId: Record<string, IncidentEvent[]> = {};
  let localEventCounter = 7000;

  for (const incident of INITIAL_INCIDENTS) {
    commentsByIncidentId[incident.id] = [];
    eventsByIncidentId[incident.id] = [
      {
        id: `EV-${localEventCounter++}`,
        incidentId: incident.id,
        message: `Incident created with status "${incident.status}".`,
        createdAt: incident.updatedAt,
      },
    ];
  }

  return {
    incidents: [...INITIAL_INCIDENTS],
    commentsByIncidentId,
    eventsByIncidentId,
    lastStatusChangeByIncidentId: {},
    counters: {
      incidentCounter: 1300,
      commentCounter: 4000,
      eventCounter: localEventCounter,
    },
  };
}

function isPersistedIncidentsData(value: unknown): value is PersistedIncidentsData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PersistedIncidentsData>;
  return (
    Array.isArray(candidate.incidents) &&
    typeof candidate.commentsByIncidentId === "object" &&
    candidate.commentsByIncidentId !== null &&
    typeof candidate.eventsByIncidentId === "object" &&
    candidate.eventsByIncidentId !== null
  );
}

function normalizePersistedData(
  data: PersistedIncidentsData,
  fallback: PersistedIncidentsData,
): PersistedIncidentsData {
  const incidents = data.incidents;
  const commentsByIncidentId: Record<string, IncidentComment[]> = {};
  const eventsByIncidentId: Record<string, IncidentEvent[]> = {};
  const lastStatusChangeByIncidentId: Record<string, IncidentLastStatusChange> = {};

  for (const incident of incidents) {
    commentsByIncidentId[incident.id] = data.commentsByIncidentId[incident.id] ?? [];
    eventsByIncidentId[incident.id] =
      data.eventsByIncidentId[incident.id] ??
      [
        {
          id: `EV-FALLBACK-${incident.id}`,
          incidentId: incident.id,
          message: `Incident created with status "${incident.status}".`,
          createdAt: incident.updatedAt,
        },
      ];
    const lastStatusChange = data.lastStatusChangeByIncidentId?.[incident.id];
    if (lastStatusChange) {
      lastStatusChangeByIncidentId[incident.id] = lastStatusChange;
    }
  }

  return {
    incidents,
    commentsByIncidentId,
    eventsByIncidentId,
    lastStatusChangeByIncidentId,
    counters: {
      incidentCounter: data.counters?.incidentCounter ?? fallback.counters.incidentCounter,
      commentCounter: data.counters?.commentCounter ?? fallback.counters.commentCounter,
      eventCounter: data.counters?.eventCounter ?? fallback.counters.eventCounter,
    },
  };
}

function readPersistedData(raw: string, fallback: PersistedIncidentsData): PersistedIncidentsData {
  const parsed = JSON.parse(raw) as unknown;

  // Backward compatibility: initial storage format was plain PersistedIncidentsData.
  if (isPersistedIncidentsData(parsed)) {
    return normalizePersistedData(parsed, fallback);
  }

  if (parsed && typeof parsed === "object") {
    const envelope = parsed as Partial<PersistedIncidentsEnvelope>;
    if (envelope.version === STORAGE_VERSION && isPersistedIncidentsData(envelope.data)) {
      return normalizePersistedData(envelope.data, fallback);
    }
  }

  throw new Error("Unsupported incidents storage format.");
}

function saveToStorage() {
  if (!isStorageAvailable()) {
    return;
  }

  const commentsByIncidentId: Record<string, IncidentComment[]> = {};
  const eventsByIncidentId: Record<string, IncidentEvent[]> = {};
  const lastStatusChangeByIncidentId: Record<string, IncidentLastStatusChange> = {};

  for (const [incidentId, comments] of commentsDb.entries()) {
    commentsByIncidentId[incidentId] = comments;
  }
  for (const [incidentId, events] of eventsDb.entries()) {
    eventsByIncidentId[incidentId] = events;
  }
  for (const [incidentId, change] of lastStatusChangeDb.entries()) {
    lastStatusChangeByIncidentId[incidentId] = change;
  }

  const payload: PersistedIncidentsEnvelope = {
    version: STORAGE_VERSION,
    data: {
      incidents: incidentsDb,
      commentsByIncidentId,
      eventsByIncidentId,
      lastStatusChangeByIncidentId,
      counters: {
        incidentCounter,
        commentCounter,
        eventCounter,
      },
    },
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function initializeData() {
  const fallback = createDefaultData();

  if (!isStorageAvailable()) {
    incidentsDb = fallback.incidents;
    commentsDb = new Map(Object.entries(fallback.commentsByIncidentId));
    eventsDb = new Map(Object.entries(fallback.eventsByIncidentId));
    lastStatusChangeDb = new Map(Object.entries(fallback.lastStatusChangeByIncidentId));
    incidentCounter = fallback.counters.incidentCounter;
    commentCounter = fallback.counters.commentCounter;
    eventCounter = fallback.counters.eventCounter;
    return;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    incidentsDb = fallback.incidents;
    commentsDb = new Map(Object.entries(fallback.commentsByIncidentId));
    eventsDb = new Map(Object.entries(fallback.eventsByIncidentId));
    lastStatusChangeDb = new Map(Object.entries(fallback.lastStatusChangeByIncidentId));
    incidentCounter = fallback.counters.incidentCounter;
    commentCounter = fallback.counters.commentCounter;
    eventCounter = fallback.counters.eventCounter;
    saveToStorage();
    return;
  }

  try {
    const parsed = readPersistedData(raw, fallback);
    incidentsDb = parsed.incidents;
    commentsDb = new Map(Object.entries(parsed.commentsByIncidentId));
    eventsDb = new Map(Object.entries(parsed.eventsByIncidentId));
    lastStatusChangeDb = new Map(Object.entries(parsed.lastStatusChangeByIncidentId ?? {}));
    incidentCounter = parsed.counters.incidentCounter;
    commentCounter = parsed.counters.commentCounter;
    eventCounter = parsed.counters.eventCounter;
  } catch {
    incidentsDb = fallback.incidents;
    commentsDb = new Map(Object.entries(fallback.commentsByIncidentId));
    eventsDb = new Map(Object.entries(fallback.eventsByIncidentId));
    lastStatusChangeDb = new Map(Object.entries(fallback.lastStatusChangeByIncidentId));
    incidentCounter = fallback.counters.incidentCounter;
    commentCounter = fallback.counters.commentCounter;
    eventCounter = fallback.counters.eventCounter;
    saveToStorage();
  }
}
initializeData();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getIncidentOrThrow(incidentId: string): Incident {
  const found = incidentsDb.find((item) => item.id === incidentId);
  if (!found) {
    throw new Error("Incident not found.");
  }
  return found;
}

function appendEvent(incidentId: string, message: string) {
  const events = eventsDb.get(incidentId) ?? [];
  events.unshift({
    id: `EV-${eventCounter++}`,
    incidentId,
    message,
    createdAt: new Date().toISOString(),
  });
  eventsDb.set(incidentId, events);
  saveToStorage();
}

function getUndoRemainingMs(change: IncidentLastStatusChange): number {
  const ageMs = Date.now() - new Date(change.changedAt).getTime();
  return Math.max(0, STATUS_UNDO_WINDOW_MS - ageMs);
}

function getActiveLastStatusChange(incidentId: string): IncidentLastStatusChange | null {
  const change = lastStatusChangeDb.get(incidentId);
  if (!change) {
    return null;
  }

  if (getUndoRemainingMs(change) <= 0) {
    lastStatusChangeDb.delete(incidentId);
    saveToStorage();
    return null;
  }

  return change;
}

function isIncidentOverdue(incident: Incident): boolean {
  if (incident.status === "resolved" || incident.status === "closed") {
    return false;
  }

  const overdueMs = 24 * 60 * 60 * 1000;
  const ageMs = Date.now() - new Date(incident.updatedAt).getTime();
  return ageMs > overdueMs;
}

export async function getIncidents(filters: IncidentsFilters): Promise<IncidentsListResponse> {
  await delay(450);

  const search = filters.search.trim().toLowerCase();
  const filtered = incidentsDb.filter((incident) => {
    const statusMatch = filters.status === "all" || incident.status === filters.status;
    const severityMatch = filters.severity === "all" || incident.severity === filters.severity;
    const overdueMatch = !filters.overdueOnly || isIncidentOverdue(incident);
    const sla = getIncidentSla(incident);
    const slaMatch =
      filters.sla === "all" ||
      (filters.sla === "breached" && sla.isBreached) ||
      (filters.sla === "at_risk" && sla.isAtRisk);
    const searchMatch =
      search.length === 0 ||
      incident.id.toLowerCase().includes(search) ||
      incident.title.toLowerCase().includes(search);

    return statusMatch && severityMatch && overdueMatch && slaMatch && searchMatch;
  });

  const start = (filters.page - 1) * filters.pageSize;
  const end = start + filters.pageSize;
  const items = filtered.slice(start, end);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages,
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  await delay(250);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeIncidents = incidentsDb.filter(
    (item) => item.status === "open" || item.status === "in_progress",
  );
  const openCount = incidentsDb.filter((item) => item.status === "open").length;
  const overdueCount = incidentsDb.filter((item) => isIncidentOverdue(item)).length;
  const resolved7dCount = incidentsDb.filter((item) => {
    if (item.status !== "resolved" && item.status !== "closed") {
      return false;
    }
    return new Date(item.updatedAt).getTime() >= sevenDaysAgo;
  }).length;
  const criticalActiveCount = incidentsDb.filter(
    (item) =>
      item.severity === "critical" && (item.status === "open" || item.status === "in_progress"),
  ).length;
  const slaBreachedActiveCount = activeIncidents.filter((item) => getIncidentSla(item).isBreached).length;
  const slaAtRiskActiveCount = activeIncidents.filter((item) => getIncidentSla(item).isAtRisk).length;

  return [
    {
      id: "open",
      label: "Open",
      value: openCount,
      description: "Incidents currently in open status",
      to: "/incidents?status=open",
    },
    {
      id: "overdue",
      label: "Overdue",
      value: overdueCount,
      description: "Active incidents older than 24h",
      to: "/incidents?overdue=1",
    },
    {
      id: "resolved7d",
      label: "Resolved (7d)",
      value: resolved7dCount,
      description: "Resolved or closed during last 7 days",
      to: "/incidents?status=resolved",
    },
    {
      id: "criticalActive",
      label: "Critical active",
      value: criticalActiveCount,
      description: "Critical incidents still in progress",
      to: "/incidents?severity=critical",
    },
    {
      id: "slaBreachedActive",
      label: "SLA breached",
      value: slaBreachedActiveCount,
      description: "Active incidents with breached SLA",
      to: "/incidents?sla=breached",
    },
    {
      id: "slaAtRiskActive",
      label: "SLA at risk",
      value: slaAtRiskActiveCount,
      description: "Active incidents that are close to SLA breach",
      to: "/incidents?sla=at_risk",
    },
  ];
}

export async function getIncidentFormOptions(): Promise<{
  teams: string[];
  assignees: string[];
}> {
  await delay(200);
  return {
    teams: [...TEAM_OPTIONS],
    assignees: [...ASSIGNEE_OPTIONS],
  };
}

export async function getIncidentDetails(incidentId: string): Promise<IncidentDetails> {
  await delay(350);
  const incident = getIncidentOrThrow(incidentId);
  const comments = commentsDb.get(incidentId) ?? [];
  const events = eventsDb.get(incidentId) ?? [];
  const lastStatusChange = getActiveLastStatusChange(incidentId);

  return {
    incident: { ...incident },
    comments: [...comments],
    events: [...events],
    lastStatusChange,
    statusUndoRemainingMs: lastStatusChange ? getUndoRemainingMs(lastStatusChange) : null,
  };
}

export function getStatusTransitions(status: IncidentStatus, role: AppRole): IncidentStatus[] {
  return getAllowedStatusTransitions(status, role);
}

export async function updateIncidentStatus(params: {
  incidentId: string;
  nextStatus: IncidentStatus;
  role: AppRole;
  actorName: string;
}): Promise<Incident> {
  await delay(250);
  const incident = getIncidentOrThrow(params.incidentId);
  const allowedNext = getAllowedStatusTransitions(incident.status, params.role);

  if (!allowedNext.includes(params.nextStatus)) {
    throw new Error("Status transition is not allowed for current role.");
  }

  const previousStatus = incident.status;
  incident.status = params.nextStatus;
  incident.updatedAt = new Date().toISOString();
  lastStatusChangeDb.set(params.incidentId, {
    previousStatus,
    nextStatus: params.nextStatus,
    changedAt: incident.updatedAt,
    actorName: params.actorName,
  });
  appendEvent(
    params.incidentId,
    `${params.actorName} changed status to "${params.nextStatus}".`,
  );

  return { ...incident };
}

export async function undoIncidentStatusChange(params: {
  incidentId: string;
  role: AppRole;
  actorName: string;
}): Promise<Incident> {
  await delay(250);

  if (!canEditIncident(params.role)) {
    throw new Error("Viewer cannot edit incidents.");
  }

  const incident = getIncidentOrThrow(params.incidentId);
  const change = getActiveLastStatusChange(params.incidentId);

  if (!change) {
    throw new Error("No recent status change to undo.");
  }

  if (incident.status !== change.nextStatus) {
    throw new Error("Undo is not available because status changed again.");
  }

  const allowedBack = getAllowedStatusTransitions(incident.status, params.role);
  if (!allowedBack.includes(change.previousStatus)) {
    throw new Error("Undo transition is not allowed for current role.");
  }

  incident.status = change.previousStatus;
  incident.updatedAt = new Date().toISOString();
  lastStatusChangeDb.delete(params.incidentId);
  appendEvent(
    params.incidentId,
    `${params.actorName} rolled back status to "${incident.status}".`,
  );

  return { ...incident };
}

export async function addIncidentComment(params: {
  incidentId: string;
  role: AppRole;
  authorName: string;
  message: string;
}): Promise<IncidentComment> {
  await delay(250);
  getIncidentOrThrow(params.incidentId);

  if (!canAddComment(params.role)) {
    throw new Error("Viewer cannot add comments.");
  }

  const message = params.message.trim();
  if (message.length === 0) {
    throw new Error("Comment cannot be empty.");
  }

  if (message.length > 2000) {
    throw new Error("Comment is too long.");
  }

  const comment: IncidentComment = {
    id: `COM-${commentCounter++}`,
    incidentId: params.incidentId,
    authorName: params.authorName,
    message,
    createdAt: new Date().toISOString(),
  };

  const comments = commentsDb.get(params.incidentId) ?? [];
  comments.unshift(comment);
  commentsDb.set(params.incidentId, comments);
  appendEvent(params.incidentId, `${params.authorName} added a comment.`);

  return comment;
}

export async function deleteIncidentComment(params: {
  incidentId: string;
  commentId: string;
  role: AppRole;
  actorName: string;
}): Promise<void> {
  await delay(250);
  getIncidentOrThrow(params.incidentId);

  if (!canDeleteComment(params.role)) {
    throw new Error("Only admin can delete comments.");
  }

  const comments = commentsDb.get(params.incidentId) ?? [];
  const nextComments = comments.filter((comment) => comment.id !== params.commentId);
  if (nextComments.length === comments.length) {
    throw new Error("Comment not found.");
  }

  commentsDb.set(params.incidentId, nextComments);
  appendEvent(params.incidentId, `${params.actorName} deleted a comment.`);
}

export async function deleteIncident(params: {
  incidentId: string;
  role: AppRole;
  actorName: string;
}): Promise<void> {
  await delay(300);

  if (!canDeleteIncident(params.role)) {
    throw new Error("Only admin can delete incidents.");
  }

  const incidentIndex = incidentsDb.findIndex((item) => item.id === params.incidentId);
  if (incidentIndex === -1) {
    throw new Error("Incident not found.");
  }

  incidentsDb.splice(incidentIndex, 1);
  commentsDb.delete(params.incidentId);
  eventsDb.delete(params.incidentId);
  lastStatusChangeDb.delete(params.incidentId);
  saveToStorage();
}

export async function createIncident(params: {
  title: string;
  description: string;
  severity: IncidentSeverity;
  priority: IncidentPriority;
  team: string;
  assignee: string;
  actorName: string;
}): Promise<Incident> {
  await delay(400);

  const now = new Date().toISOString();
  const incident: Incident = {
    id: `INC-${incidentCounter++}`,
    title: params.title.trim(),
    description: params.description.trim(),
    severity: params.severity,
    priority: params.priority,
    status: "open",
    team: params.team,
    assignee: params.assignee,
    updatedAt: now,
  };

  incidentsDb.unshift(incident);
  commentsDb.set(incident.id, []);
  eventsDb.set(incident.id, [
    {
      id: `EV-${eventCounter++}`,
      incidentId: incident.id,
      message: `${params.actorName} created the incident.`,
      createdAt: now,
    },
  ]);
  saveToStorage();

  return { ...incident };
}

export async function updateIncident(params: {
  incidentId: string;
  role: AppRole;
  actorName: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  priority: IncidentPriority;
  team: string;
  assignee: string;
}): Promise<Incident> {
  await delay(350);

  if (!canEditIncident(params.role)) {
    throw new Error("Viewer cannot edit incidents.");
  }

  const incident = getIncidentOrThrow(params.incidentId);
  incident.title = params.title.trim();
  incident.description = params.description.trim();
  incident.severity = params.severity;
  incident.priority = params.priority;
  incident.team = params.team;
  incident.assignee = params.assignee;
  incident.updatedAt = new Date().toISOString();

  appendEvent(params.incidentId, `${params.actorName} updated incident fields.`);
  return { ...incident };
}
