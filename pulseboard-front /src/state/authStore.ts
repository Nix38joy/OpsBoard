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
    if (!parsed.userName || !parsed.email || !parsed.role || !parsed.accessToken) {
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
  login: (session: AuthSession) => void;
  logout: () => void;
};

const initialSession = readSession();

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: Boolean(initialSession),
  role: initialSession?.role ?? null,
  userName: initialSession?.userName ?? null,
  login: (session) =>
    set(() => {
      // 💡 ИСПРАВЛЕНО: Сохраняем весь объект сессии целиком, чтобы email и accessToken не терялись
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      return {
        isAuthenticated: true,
        userName: session.userName,
        role: session.role,
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