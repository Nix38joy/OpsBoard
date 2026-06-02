import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { useAuthStore } from "../../state/authStore";
import { renderWithProviders } from "../../test/renderWithProviders";
import { IncidentDetailsPage } from "./IncidentDetailsPage";
import { AppRole, IncidentDetails, IncidentStatus } from "../../domain/incidents";
import * as incidentsApi from "../../api/incidents";

vi.mock("../../api/incidents", async () => {
  const actual = await vi.importActual<typeof import("../../api/incidents")>("../../api/incidents");
  return {
    ...actual,
    getIncidentDetails: vi.fn(),
    getStatusTransitions: vi.fn(),
    updateIncidentStatus: vi.fn(),
    undoIncidentStatusChange: vi.fn(),
    addIncidentComment: vi.fn(),
    deleteIncidentComment: vi.fn(),
    deleteIncident: vi.fn(),
  };
});

let detailsState: IncidentDetails;

function cloneState() {
  return {
    incident: { ...detailsState.incident },
    comments: detailsState.comments.map((comment) => ({ ...comment })),
    events: detailsState.events.map((event) => ({ ...event })),
    lastStatusChange: detailsState.lastStatusChange ? { ...detailsState.lastStatusChange } : null,
    statusUndoRemainingMs: detailsState.statusUndoRemainingMs ?? null,
  } satisfies IncidentDetails;
}

function getTransitions(status: IncidentStatus, role: AppRole): IncidentStatus[] {
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

describe("IncidentDetailsPage integration", () => {
  beforeEach(() => {
    detailsState = {
      incident: {
        id: "INC-9001",
        title: "Test incident",
        description: "Detailed integration test incident description.",
        severity: "high",
        priority: "p2",
        status: "open",
        team: "Ops UI",
        assignee: "Daria Melnik",
        updatedAt: "2026-03-10T10:00:00.000Z",
      },
      comments: [
        {
          id: "COM-9001",
          incidentId: "INC-9001",
          authorName: "Operator User",
          message: "Initial comment",
          createdAt: "2026-03-10T10:00:00.000Z",
        },
      ],
      events: [],
      lastStatusChange: null,
      statusUndoRemainingMs: null,
    };

    vi.mocked(incidentsApi.getIncidentDetails).mockImplementation(async () => cloneState());
    vi.mocked(incidentsApi.getStatusTransitions).mockImplementation((status, role) =>
      getTransitions(status, role),
    );
    vi.mocked(incidentsApi.updateIncidentStatus).mockImplementation(async ({ nextStatus }) => {
      detailsState.incident.status = nextStatus;
      detailsState.lastStatusChange = {
        previousStatus: "open",
        nextStatus,
        actorName: "Operator User",
        changedAt: new Date().toISOString(),
      };
      detailsState.statusUndoRemainingMs = 30000;
      detailsState.events.unshift({
        id: `EV-${Date.now()}`,
        incidentId: detailsState.incident.id,
        message: `Status changed to "${nextStatus}".`,
        createdAt: new Date().toISOString(),
      });
      return { ...detailsState.incident };
    });
    vi.mocked(incidentsApi.undoIncidentStatusChange).mockImplementation(async () => {
      detailsState.incident.status = detailsState.lastStatusChange?.previousStatus ?? "open";
      detailsState.lastStatusChange = null;
      detailsState.statusUndoRemainingMs = null;
      detailsState.events.unshift({
        id: `EV-${Date.now()}`,
        incidentId: detailsState.incident.id,
        message: 'Status rolled back to "open".',
        createdAt: new Date().toISOString(),
      });
      return { ...detailsState.incident };
    });
    vi.mocked(incidentsApi.addIncidentComment).mockImplementation(async ({ authorName, message }) => {
      const comment = {
        id: `COM-${Date.now()}`,
        incidentId: detailsState.incident.id,
        authorName,
        message,
        createdAt: new Date().toISOString(),
      };
      detailsState.comments.unshift(comment);
      return comment;
    });
    vi.mocked(incidentsApi.deleteIncidentComment).mockImplementation(async ({ role, commentId }) => {
      if (role !== "admin") {
        throw new Error("Only admin can delete comments.");
      }
      detailsState.comments = detailsState.comments.filter((comment) => comment.id !== commentId);
    });
    vi.mocked(incidentsApi.deleteIncident).mockImplementation(async ({ role, incidentId }) => {
      if (role !== "admin") {
        throw new Error("Only admin can delete incidents.");
      }
      if (incidentId !== detailsState.incident.id) {
        throw new Error("Incident not found.");
      }
    });
  });

  function renderDetails() {
    return renderWithProviders(
      <Routes>
        <Route path="/incidents/:incidentId" element={<IncidentDetailsPage />} />
        <Route path="/incidents" element={<p>Incidents list page</p>} />
      </Routes>,
      "/incidents/INC-9001",
    );
  }

  it("allows operator to change status and add comment", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      role: "operator",
      userName: "Operator User",
    });

    const user = userEvent.setup();
    renderDetails();

    expect(await screen.findByText("Test incident")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /Set .*progress/i }));

    await waitFor(() => {
      expect(incidentsApi.updateIncidentStatus).toHaveBeenCalled();
      expect(screen.getByText('Status changed to "in_progress".')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("Write a comment (for operator/admin)"), "Added from test");
    await user.click(screen.getByRole("button", { name: "Add comment" }));

    await waitFor(() => {
      expect(incidentsApi.addIncidentComment).toHaveBeenCalled();
      expect(screen.getByText("Added from test")).toBeInTheDocument();
    });
  });

  it("shows comments as read-only for viewer", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      role: "viewer",
      userName: "Viewer User",
    });

    renderDetails();

    expect(await screen.findByText("Test incident")).toBeInTheDocument();
    expect(await screen.findByText("Viewer role can only read comments.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add comment" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Delete comment" })).not.toBeInTheDocument();
  });

  it("allows admin to delete comment", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      role: "admin",
      userName: "Admin User",
    });

    const user = userEvent.setup();
    renderDetails();

    expect(await screen.findByText("Initial comment")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete comment" }));

    await waitFor(() => {
      expect(incidentsApi.deleteIncidentComment).toHaveBeenCalled();
      expect(screen.queryByText("Initial comment")).not.toBeInTheDocument();
    });
  });

  it("shows undo action and calls undo API for operator", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      role: "operator",
      userName: "Operator User",
    });
    detailsState.incident.status = "in_progress";
    detailsState.lastStatusChange = {
      previousStatus: "open",
      nextStatus: "in_progress",
      actorName: "Operator User",
      changedAt: "2026-03-10T10:00:00.000Z",
    };
    detailsState.statusUndoRemainingMs = 20000;

    const user = userEvent.setup();
    renderDetails();

    const undoButton = await screen.findByRole("button", { name: /Undo last change/i });
    expect(screen.getByText(/Last change:/)).toBeInTheDocument();
    await user.click(undoButton);

    await waitFor(() => {
      expect(incidentsApi.undoIncidentStatusChange).toHaveBeenCalled();
    });
  });

  it("allows admin to delete incident after confirmation", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      role: "admin",
      userName: "Admin User",
    });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    const user = userEvent.setup();
    renderDetails();

    expect(await screen.findByText("Test incident")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete incident" }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(incidentsApi.deleteIncident).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
