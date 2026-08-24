import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { messages } from "./catalog.ts";
import { fmt } from "./fmt.ts";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_CODES,
  isLocale,
  type Locale,
} from "./locales.ts";
import type { Messages } from "./types.ts";

const STORAGE_KEY = "clerk.locale";

type I18nContextValue = {
  locale: Locale;
  localeTag: string;
  setLocale: (locale: Locale) => void;
  t: Messages;
  fmt: typeof fmt;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

function detectLocale(): Locale {
  const stored = readStoredLocale();
  if (stored) return stored;
  const nav = window.navigator.language?.toLowerCase() ?? "";
  const match = LOCALE_CODES.find(
    (code) => nav === code || nav.startsWith(`${code}-`),
  );
  return match ?? DEFAULT_LOCALE;
}

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore quota / private-mode failures
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      localeTag: LOCALES[locale].tag,
      setLocale,
      t: messages[locale],
      fmt,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
