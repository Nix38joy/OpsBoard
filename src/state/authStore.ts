import { create } from "zustand";
import { AuthSession } from "../api/auth";
import { AppRole } from "../domain/incidents";

const AUTH_SESSION_KEY = "opsboard.auth.session";

function readSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.userName || !parsed.role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

type AuthState = {
  isAuthenticated: boolean;
  role: AppRole | null;
  userName: string | null;
  login: (params: AuthSession) => void;
  logout: () => void;
};

const initialSession = readSession();

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: Boolean(initialSession),
  role: initialSession?.role ?? null,
  userName: initialSession?.userName ?? null,
  login: ({ userName, role }) =>
    set(() => {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ userName, role }));
      return {
        isAuthenticated: true,
        userName,
        role,
      };
    }),
  logout: () =>
    set(() => {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return {
        isAuthenticated: false,
        userName: null,
        role: null,
      };
    }),
}));
