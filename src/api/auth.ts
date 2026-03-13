import { AppRole } from "../domain/incidents";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  userName: string;
  email: string;
  password: string;
};

export type AuthSession = {
  userName: string;
  email: string;
  role: AppRole;
  accessToken: string;
};

type StoredAuthUser = {
  id: string;
  userName: string;
  email: string;
  passwordHash: string;
  role: AppRole;
  createdAt: string;
};

const USERS_STORAGE_KEY = "opsboard.auth.users.v1";

const DEMO_USERS: Array<{
  userName: string;
  email: string;
  password: string;
  role: AppRole;
}> = [
  {
    userName: "Admin User",
    email: "admin@opsboard.dev",
    password: "Admin123!",
    role: "admin",
  },
  {
    userName: "Operator User",
    email: "operator@opsboard.dev",
    password: "Operator123!",
    role: "operator",
  },
  {
    userName: "Viewer User",
    email: "viewer@opsboard.dev",
    password: "Viewer123!",
    role: "viewer",
  },
];

function hashPassword(password: string): string {
  // This is intentionally simple because the app runs fully in browser localStorage.
  return btoa(password.split("").reverse().join(""));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createSessionFromUser(user: StoredAuthUser): AuthSession {
  return {
    userName: user.userName,
    email: user.email,
    role: user.role,
    accessToken: `demo-token-${user.id}-${Date.now()}`,
  };
}

function readUsers(): StoredAuthUser[] {
  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuthUser[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveUsers(users: StoredAuthUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function ensureSeedUsers() {
  const existing = readUsers();
  if (existing.length > 0) {
    return;
  }

  const now = new Date().toISOString();
  const seededUsers: StoredAuthUser[] = DEMO_USERS.map((user, index) => ({
    id: `USR-SEED-${index + 1}`,
    userName: user.userName,
    email: normalizeEmail(user.email),
    passwordHash: hashPassword(user.password),
    role: user.role,
    createdAt: now,
  }));
  saveUsers(seededUsers);
}

function validateEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@") || !normalized.includes(".")) {
    throw new Error("Enter a valid email address.");
  }
}

function validatePassword(password: string) {
  if (password.length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  ensureSeedUsers();

  const userName = payload.userName.trim();
  const email = normalizeEmail(payload.email);
  const password = payload.password;

  if (userName.length < 3) {
    throw new Error("User name must contain at least 3 characters.");
  }

  validateEmail(email);
  validatePassword(password);

  const users = readUsers();
  const duplicate = users.some((user) => user.email === email);
  if (duplicate) {
    throw new Error("User with this email already exists.");
  }

  const createdUser: StoredAuthUser = {
    id: `USR-${Date.now()}`,
    userName,
    email,
    passwordHash: hashPassword(password),
    role: "viewer",
    createdAt: new Date().toISOString(),
  };

  saveUsers([createdUser, ...users]);
  return createSessionFromUser(createdUser);
}

export async function loginRequest(payload: LoginPayload): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  ensureSeedUsers();

  const email = normalizeEmail(payload.email);
  const password = payload.password;

  validateEmail(email);
  validatePassword(password);

  const users = readUsers();
  const found = users.find((user) => user.email === email);
  if (!found || found.passwordHash !== hashPassword(password)) {
    throw new Error("Invalid email or password.");
  }

  return createSessionFromUser(found);
}

export function getDemoAccounts() {
  return DEMO_USERS.map((account) => ({
    userName: account.userName,
    email: account.email,
    password: account.password,
    role: account.role,
  }));
}

export async function requestPasswordReset(emailInput: string): Promise<{ message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  ensureSeedUsers();

  const email = normalizeEmail(emailInput);
  validateEmail(email);

  // In real auth flows, keep response generic to avoid account enumeration.
  return {
    message: "If an account exists, password reset instructions have been sent.",
  };
}
