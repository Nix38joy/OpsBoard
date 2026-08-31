import { Incident, IncidentPriority, IncidentStatus } from "./incidents";

type IncidentSla = {
  isTracked: boolean;
  isBreached: boolean;
  isAtRisk: boolean;
  remainingMs: number | null;
};

const SLA_THRESHOLD_BY_PRIORITY_MS: Record<IncidentPriority, number> = {
  p1: 2 * 60 * 60 * 1000,
  p2: 8 * 60 * 60 * 1000,
  p3: 24 * 60 * 60 * 1000,
  p4: 72 * 60 * 60 * 1000,
};

function isStatusTrackedBySla(status: IncidentStatus): boolean {
  return status === "open" || status === "in_progress";
}

export function getIncidentSla(incident: Incident, nowMs = Date.now()): IncidentSla {
  if (!isStatusTrackedBySla(incident.status)) {
    return {
      isTracked: false,
      isBreached: false,
      isAtRisk: false,
      remainingMs: null,
    };
  }

  const updatedAtMs = new Date(incident.updatedAt).getTime();
  const elapsedMs = Math.max(0, nowMs - updatedAtMs);
  const thresholdMs = SLA_THRESHOLD_BY_PRIORITY_MS[incident.priority];
  const remainingMs = thresholdMs - elapsedMs;
  const isBreached = remainingMs <= 0;
  const isAtRisk = !isBreached && remainingMs <= thresholdMs * 0.25;

  return {
    isTracked: true,
    isBreached,
    isAtRisk,
    remainingMs,
  };
}

export function formatSlaRemaining(remainingMs: number): string {
  const safeMs = Math.max(0, remainingMs);
  const totalMinutes = Math.floor(safeMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

