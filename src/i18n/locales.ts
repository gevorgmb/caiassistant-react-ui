export const LOCALES = {
  en: { nativeName: "English", tag: "en" },
  hy: { nativeName: "Հայերեն", tag: "hy-AM" },
  ru: { nativeName: "Русский", tag: "ru-RU" },
} as const;

export type Locale = keyof typeof LOCALES;
export const LOCALE_CODES = Object.keys(LOCALES) as Locale[];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && value in LOCALES;
}
