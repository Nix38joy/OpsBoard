import { create } from "zustand";

const UI_SETTINGS_KEY = "opsboard.ui.settings";

type UiSettings = {
  autoRefreshEnabled: boolean;
};

type UiSettingsState = UiSettings & {
  setAutoRefreshEnabled: (value: boolean) => void;
};

function readUiSettings(): UiSettings {
  const fallback: UiSettings = { autoRefreshEnabled: true };
  const raw = localStorage.getItem(UI_SETTINGS_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UiSettings>;
    return {
      autoRefreshEnabled: parsed.autoRefreshEnabled ?? fallback.autoRefreshEnabled,
    };
  } catch {
    return fallback;
  }
}

const initialSettings = readUiSettings();

export const useUiSettingsStore = create<UiSettingsState>((set) => ({
  autoRefreshEnabled: initialSettings.autoRefreshEnabled,
  setAutoRefreshEnabled: (value) =>
    set(() => {
      const nextSettings: UiSettings = {
        autoRefreshEnabled: value,
      };
      localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(nextSettings));
      return nextSettings;
    }),
}));

