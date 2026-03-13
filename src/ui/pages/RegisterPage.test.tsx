import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterPage } from "./RegisterPage";
import { renderWithProviders } from "../../test/renderWithProviders";
import { useAuthStore } from "../../state/authStore";

describe("RegisterPage form readiness", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      isAuthenticated: false,
      role: null,
      userName: null,
    });
  });

  it("keeps submit disabled until all requirements are met", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, "/register");

    const submitButton = screen.getByRole("button", { name: "Register" });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("User name"), "New User");
    await user.type(screen.getByLabelText("Email"), "new.user@example.com");
    await user.type(screen.getByLabelText("Password"), "Strong123!");
    await user.type(screen.getByLabelText("Confirm password"), "Strong123!");

    expect(submitButton).toBeEnabled();
  });

  it("shows mismatch warning and keeps submit disabled", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, "/register");

    const submitButton = screen.getByRole("button", { name: "Register" });

    await user.type(screen.getByLabelText("User name"), "New User");
    await user.type(screen.getByLabelText("Email"), "new.user@example.com");
    await user.type(screen.getByLabelText("Password"), "Strong123!");
    await user.type(screen.getByLabelText("Confirm password"), "Mismatch123!");

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});

