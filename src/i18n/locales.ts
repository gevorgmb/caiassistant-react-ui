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

/** Post-Soviet states; used when the country's own language is not in LOCALES. */
const FORMER_SOVIET_COUNTRIES = new Set([
  "AM",
  "AZ",
  "BY",
  "EE",
  "GE",
  "KZ",
  "KG",
  "LV",
  "LT",
  "MD",
  "RU",
  "TJ",
  "TM",
  "UA",
  "UZ",
]);

const OFFICIAL_SUPPORTED_LOCALE: Record<string, Locale> = {
  AM: "hy",
  RU: "ru",
};

export function localeFromBrowser(): Locale | null {
  if (typeof navigator === "undefined") return null;
  const tags = [...(navigator.languages ?? []), navigator.language];
  for (const tag of tags) {
    const lower = tag?.toLowerCase() ?? "";
    const match = LOCALE_CODES.find(
      (code) => lower === code || lower.startsWith(`${code}-`),
    );
    if (match) return match;
  }
  return null;
}

export function localeFromCountry(country: string | undefined): Locale | null {
  const code = country?.trim().toUpperCase();
  if (!code) return null;
  const official = OFFICIAL_SUPPORTED_LOCALE[code];
  if (official) return official;
  if (FORMER_SOVIET_COUNTRIES.has(code)) return "ru";
  return "en";
}

export function detectPreferredLocale(input?: {
  savedLocale?: Locale | null;
  country?: string;
}): Locale {
  if (isLocale(input?.savedLocale)) return input.savedLocale;

  const browser = localeFromBrowser();
  if (browser) return browser;

  return localeFromCountry(input?.country) ?? DEFAULT_LOCALE;
}
