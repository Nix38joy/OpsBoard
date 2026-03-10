import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IncidentCreatePage } from "./IncidentCreatePage";
import { renderWithProviders } from "../../test/renderWithProviders";
import { useAuthStore } from "../../state/authStore";

const createIncidentMock = vi.fn();

vi.mock("../../api/incidents", async () => {
  const actual = await vi.importActual<typeof import("../../api/incidents")>("../../api/incidents");
  return {
    ...actual,
    getIncidentFormOptions: vi.fn().mockResolvedValue({
      teams: ["Payments"],
      assignees: ["Ilya Petrov"],
    }),
    createIncident: (...args: unknown[]) => createIncidentMock(...args),
  };
});

describe("IncidentCreatePage validation", () => {
  beforeEach(() => {
    createIncidentMock.mockReset();
    createIncidentMock.mockResolvedValue({ id: "INC-5000" });
    useAuthStore.setState({
      isAuthenticated: true,
      role: "operator",
      userName: "Test Operator",
    });
  });

  it("shows validation errors and does not submit invalid form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentCreatePage />, "/incidents/new");

    await user.click(screen.getByRole("button", { name: "Create incident" }));

    expect(await screen.findByText("Title must contain at least 5 characters.")).toBeInTheDocument();
    expect(screen.getByText("Description must contain at least 20 characters.")).toBeInTheDocument();
    expect(screen.getByText("Team is required.")).toBeInTheDocument();
    expect(screen.getByText("Assignee is required.")).toBeInTheDocument();
    expect(createIncidentMock).not.toHaveBeenCalled();
  });

  it("submits valid form payload", async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncidentCreatePage />, "/incidents/new");

    await user.type(screen.getByLabelText("Title"), "Queue delay in payments");
    await user.type(
      screen.getByLabelText("Description"),
      "Transactions are delayed for more than ten minutes in production environment.",
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Team")).toBeEnabled();
      expect(screen.getByLabelText("Assignee")).toBeEnabled();
    });

    await user.selectOptions(screen.getByLabelText("Team"), "Payments");
    await user.selectOptions(screen.getByLabelText("Assignee"), "Ilya Petrov");
    await user.click(screen.getByRole("button", { name: "Create incident" }));

    await waitFor(() => expect(createIncidentMock).toHaveBeenCalledTimes(1));
    const payload = createIncidentMock.mock.calls[0]?.[0];
    expect(payload).toEqual(
      expect.objectContaining({
        title: "Queue delay in payments",
        team: "Payments",
        assignee: "Ilya Petrov",
        actorName: "Test Operator",
      }),
    );
  });
});
