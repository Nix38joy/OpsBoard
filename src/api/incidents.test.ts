import {
  addIncidentComment,
  getStatusTransitions,
  undoIncidentStatusChange,
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

  it("allows operator to undo recent status change", async () => {
    await updateIncidentStatus({
      incidentId: "INC-1204",
      nextStatus: "in_progress",
      role: "operator",
      actorName: "Operator",
    });

    const reverted = await undoIncidentStatusChange({
      incidentId: "INC-1204",
      role: "operator",
      actorName: "Operator",
    });

    expect(reverted.status).toBe("resolved");
  });

  it("rejects undo when there is no recent status change", async () => {
    await expect(
      undoIncidentStatusChange({
        incidentId: "INC-1203",
        role: "operator",
        actorName: "Operator",
      }),
    ).rejects.toThrow("No recent status change to undo.");
  });

  it("rejects undo for viewer role", async () => {
    await updateIncidentStatus({
      incidentId: "INC-1207",
      nextStatus: "in_progress",
      role: "operator",
      actorName: "Operator",
    });

    await expect(
      undoIncidentStatusChange({
        incidentId: "INC-1207",
        role: "viewer",
        actorName: "Viewer",
      }),
    ).rejects.toThrow("Viewer cannot edit incidents.");
  });
});
