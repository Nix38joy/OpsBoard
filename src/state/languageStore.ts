import { create } from "zustand";
import { AppLanguage } from "../i18n/translations";

const LANGUAGE_KEY = "opsboard.ui.language";

type LanguageState = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
};

function readLanguage(): AppLanguage {
  const raw = localStorage.getItem(LANGUAGE_KEY);
  if (raw === "ru" || raw === "en") {
    return raw;
  }
  return "en";
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: readLanguage(),
  setLanguage: (language) =>
    set(() => {
      localStorage.setItem(LANGUAGE_KEY, language);
      return { language };
    }),
}));

