import {
  addIncidentComment,
  createIncident,
  deleteIncident,
  getIncidentDetails,
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

  it("allows admin to delete incident", async () => {
    const created = await createIncident({
      title: "Delete me incident",
      description: "Temporary incident created to verify deletion behavior for admin role.",
      severity: "low",
      priority: "p4",
      team: "Ops UI",
      assignee: "Daria Melnik",
      actorName: "Admin",
    });

    await expect(
      deleteIncident({
        incidentId: created.id,
        role: "admin",
        actorName: "Admin",
      }),
    ).resolves.toBeUndefined();

    await expect(getIncidentDetails(created.id)).rejects.toThrow("Incident not found.");
  });

  it("rejects incident deletion for non-admin role", async () => {
    const created = await createIncident({
      title: "Forbidden delete incident",
      description: "Temporary incident created to verify non-admin delete restriction.",
      severity: "medium",
      priority: "p3",
      team: "Payments",
      assignee: "Ilya Petrov",
      actorName: "Operator",
    });

    await expect(
      deleteIncident({
        incidentId: created.id,
        role: "operator",
        actorName: "Operator",
      }),
    ).rejects.toThrow("Only admin can delete incidents.");
  });
});
