import { AppRole } from "../domain/incidents";

type LoginPayload = {
  email: string;
  password: string;
};

export type AuthSession = {
  userName: string;
  role: AppRole;
};

type MockAccount = {
  email: string;
  password: string;
  userName: string;
  role: AppRole;
};

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    email: "viewer@opsboard.dev",
    password: "123456",
    userName: "Viewer User",
    role: "viewer",
  },
  {
    email: "operator@opsboard.dev",
    password: "123456",
    userName: "Operator User",
    role: "operator",
  },
  {
    email: "admin@opsboard.dev",
    password: "123456",
    userName: "Admin User",
    role: "admin",
  },
];

export async function loginRequest(payload: LoginPayload): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  const email = payload.email.trim().toLowerCase();
  const password = payload.password.trim();
  const account = MOCK_ACCOUNTS.find((item) => item.email === email && item.password === password);

  if (!account) {
    throw new Error("Invalid email or password.");
  }

  return {
    userName: account.userName,
    role: account.role,
  };
}
