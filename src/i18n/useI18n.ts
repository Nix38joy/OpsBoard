import { useCallback } from "react";
import { useLanguageStore } from "../state/languageStore";
import { translations, TranslationKey } from "./translations";

export function useI18n() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const template = translations[language][key] ?? translations.en[key];
      if (!vars) {
        return template;
      }
      return Object.entries(vars).reduce(
        (acc, [varName, value]) => acc.replaceAll(`{${varName}}`, String(value)),
        template,
      );
    },
    [language],
  );

  return { language, setLanguage, t };
}

