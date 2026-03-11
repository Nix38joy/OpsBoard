import { IncidentStatus } from "./incidents";
import {
  canAddComment,
  canCreateIncident,
  canDeleteComment,
  canEditIncident,
  getAllowedStatusTransitions,
} from "./permissions";

describe("permissions", () => {
  it("allows creating and editing incidents only for operator/admin", () => {
    expect(canCreateIncident("viewer")).toBe(false);
    expect(canCreateIncident("operator")).toBe(true);
    expect(canCreateIncident("admin")).toBe(true);
    expect(canCreateIncident(null)).toBe(false);

    expect(canEditIncident("viewer")).toBe(false);
    expect(canEditIncident("operator")).toBe(true);
    expect(canEditIncident("admin")).toBe(true);
    expect(canEditIncident(null)).toBe(false);
  });

  it("allows adding comments for operator/admin and denies for viewer/null", () => {
    expect(canAddComment("viewer")).toBe(false);
    expect(canAddComment("operator")).toBe(true);
    expect(canAddComment("admin")).toBe(true);
    expect(canAddComment(null)).toBe(false);
  });

  it("allows deleting comments only for admin", () => {
    expect(canDeleteComment("viewer")).toBe(false);
    expect(canDeleteComment("operator")).toBe(false);
    expect(canDeleteComment("admin")).toBe(true);
    expect(canDeleteComment(null)).toBe(false);
  });

  it("returns correct transitions for standard roles and statuses", () => {
    const commonCases: Array<{ status: IncidentStatus; expected: IncidentStatus[] }> = [
      { status: "open", expected: ["in_progress", "resolved"] },
      { status: "in_progress", expected: ["resolved"] },
      { status: "resolved", expected: ["closed", "in_progress"] },
      { status: "closed", expected: [] },
    ];

    for (const testCase of commonCases) {
      expect(getAllowedStatusTransitions(testCase.status, "viewer")).toEqual(testCase.expected);
      expect(getAllowedStatusTransitions(testCase.status, "operator")).toEqual(testCase.expected);
    }
  });

  it("allows admin-only reopen transition from closed to in_progress", () => {
    expect(getAllowedStatusTransitions("closed", "admin")).toEqual(["in_progress"]);
  });
});

