type AppRole = "viewer" | "operator" | "admin";

type LoginPayload = {
  userName: string;
  role: AppRole;
};

export type AuthSession = {
  userName: string;
  role: AppRole;
};

export async function loginRequest(payload: LoginPayload): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  if (payload.userName.trim().length < 3) {
    throw new Error("User name must contain at least 3 characters.");
  }

  return {
    userName: payload.userName.trim(),
    role: payload.role,
  };
}
