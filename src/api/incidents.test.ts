import {
  addIncidentComment,
  getStatusTransitions,
  updateIncident,
  updateIncidentStatus,
} from "./incidents";

describe("incidents business rules", () => {
  it("returns admin-only reopen transition for closed status", () => {
    expect(getStatusTransitions("closed", "operator")).toEqual([]);
    expect(getStatusTransitions("closed", "admin")).toEqual(["in_progress"]);
  });

  it("rejects invalid status transition for operator", async () => {
    await expect(
      updateIncidentStatus({
        incidentId: "INC-1205",
        nextStatus: "in_progress",
        role: "operator",
        actorName: "Operator",
      }),
    ).rejects.toThrow("Status transition is not allowed for current role.");
  });

  it("rejects comment create for viewer", async () => {
    await expect(
      addIncidentComment({
        incidentId: "INC-1201",
        role: "viewer",
        authorName: "Viewer",
        message: "Need updates",
      }),
    ).rejects.toThrow("Viewer cannot add comments.");
  });

  it("rejects incident field editing for viewer", async () => {
    await expect(
      updateIncident({
        incidentId: "INC-1201",
        role: "viewer",
        actorName: "Viewer",
        title: "Updated title",
        description: "This description is long enough to pass form rules in update flow.",
        severity: "high",
        priority: "p1",
        team: "Payments",
        assignee: "Ilya Petrov",
      }),
    ).rejects.toThrow("Viewer cannot edit incidents.");
  });
});
