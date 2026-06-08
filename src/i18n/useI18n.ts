import { useCallback } from "react";
import { useLanguageStore } from "../state/languageStore";
import { translations } from "./translations"; // 👈 Исправили имя файла (без s)

// 💡 Автоматически создаем тип для ключей на основе английского словаря.
// Теперь здесь будут строго валидные строки вроде "navDashboard", "toastIncidentCreated" и т.д.
type TranslationKey = keyof typeof translations.en;

export function useI18n() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      // Извлекаем строку шаблона для текущего языка с фоллбэком на английский
      const template: string = translations[language]?.[key] ?? translations.en?.[key] ?? "";
      
      if (!vars) {
        return template;
      }
      
      return Object.entries(vars).reduce(
        (acc, [varName, value]) => {
          // Динамически подставляем переменные в шаблоны вида {id} или {actor}
          return acc.replace(new RegExp(`{${varName}}`, "g"), String(value));
        },
        template,
      );
    },
    [language],
  );

  return { language, setLanguage, t };
}


