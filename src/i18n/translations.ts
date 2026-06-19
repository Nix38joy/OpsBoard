import en from "./locales/en.json";
import ru from "./locales/ru.json";

export type AppLanguage = "en" | "ru";

type TranslationKeys = typeof en;

export const translations: Record<AppLanguage, TranslationKeys> = {
  en,
  ru
};



