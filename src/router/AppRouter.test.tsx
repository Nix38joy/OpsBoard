import { screen } from "@testing-library/react";
import { AppRouter } from "./AppRouter";
import { renderWithProviders } from "../test/renderWithProviders";
import { useAuthStore } from "../state/authStore";

describe("AppRouter access control", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      isAuthenticated: false,
      role: null,
      userName: null,
    });
  });

  it("redirects unauthenticated user to login on protected route", async () => {
    renderWithProviders(<AppRouter />, "/incidents/new");

    expect(await screen.findByText("OpsBoard Login")).toBeInTheDocument();
  });

  it("denies viewer access to create page", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      role: "viewer",
      userName: "Viewer User",
    });

    renderWithProviders(<AppRouter />, "/incidents/new");

    expect(await screen.findByText("Access denied")).toBeInTheDocument();
  });

  it("allows operator access to create page", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      role: "operator",
      userName: "Operator User",
    });

    renderWithProviders(<AppRouter />, "/incidents/new");

    expect(await screen.findByRole("heading", { name: "Create Incident" })).toBeInTheDocument();
  });
});
