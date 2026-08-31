import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
};

type ToastStore = {
  toasts: ToastItem[];
  pushToast: (params: { kind: ToastKind; message: string; durationMs?: number }) => void;
  removeToast: (id: string) => void;
};

const DEFAULT_TOAST_DURATION_MS = 4500;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  pushToast: ({ kind, message, durationMs = DEFAULT_TOAST_DURATION_MS }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    set((state) => ({
      toasts: [{ id, kind, message }, ...state.toasts],
    }));

    window.setTimeout(() => {
      get().removeToast(id);
    }, durationMs);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

