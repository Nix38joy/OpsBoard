import { useCallback } from "react";
import { useLanguageStore } from "../state/languageStore";
import { translations, TranslationKey } from "./translations";

export function useI18n() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      // Подстраховка: если перевода нет, берем английский, иначе пустую строку
      const template: string = translations[language]?.[key] ?? translations.en?.[key] ?? "";
      
      if (!vars) {
        return template;
      }
      
      return Object.entries(vars).reduce(
        (acc, [varName, value]) => {
          // Используем регулярное выражение с флагом 'g' вместо replaceAll
          return acc.replace(new RegExp(`{${varName}}`, "g"), String(value));
        },
        template,
      );
    },
    [language],
  );

  return { language, setLanguage, t };
}

