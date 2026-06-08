import en from "./locales/en.json";
import ru from "./locales/ru.json";

export type AppLanguage = "en" | "ru";

// Автоматически вытаскиваем тип всех ключей из эталонного английского файла
type TranslationKeys = typeof en;

// Строго типизируем объект переводов. 
// Теперь TypeScript гарантирует, что в 'ru' будут ТОЧНО ТЕ ЖЕ ключи, что и в 'en'
export const translations: Record<AppLanguage, TranslationKeys> = {
  en,
  ru
};



