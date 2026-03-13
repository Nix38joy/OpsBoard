import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { renderWithProviders } from "../../test/renderWithProviders";
import { useAuthStore } from "../../state/authStore";

const requestPasswordResetMock = vi.fn();

vi.mock("../../api/auth", async () => {
  const actual = await vi.importActual<typeof import("../../api/auth")>("../../api/auth");
  return {
    ...actual,
    requestPasswordReset: (...args: unknown[]) => requestPasswordResetMock(...args),
  };
});

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    localStorage.clear();
    requestPasswordResetMock.mockReset();
    requestPasswordResetMock.mockResolvedValue({
      message: "If an account exists, password reset instructions have been sent.",
    });
    useAuthStore.setState({
      isAuthenticated: false,
      role: null,
      userName: null,
    });
  });

  it("submits email and shows success message", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />, "/forgot-password");

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Send instructions" }));

    await waitFor(() => expect(requestPasswordResetMock).toHaveBeenCalledTimes(1));
    expect(requestPasswordResetMock.mock.calls[0]?.[0]).toBe("user@example.com");
    expect(await screen.findByText("If an account exists, password reset instructions have been sent."))
      .toBeInTheDocument();
  });
});

