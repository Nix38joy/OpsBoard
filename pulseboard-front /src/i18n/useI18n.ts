import { useCallback } from "react";
import { useLanguageStore } from "../state/languageStore";
import { translations } from "./translations"; 

type TranslationKey = keyof typeof translations.en;

export function useI18n() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {

      const template: string = translations[language]?.[key] ?? translations.en?.[key] ?? "";
      
      if (!vars) {
        return template;
      }
      
      return Object.entries(vars).reduce(
        (acc, [varName, value]) => {
          return acc.replace(new RegExp(`{${varName}}`, "g"), String(value));
        },
        template,
      );
    },
    [language],
  );

  return { language, setLanguage, t };
}


