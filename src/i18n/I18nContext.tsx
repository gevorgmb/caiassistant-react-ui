import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthContext.tsx";
import { CookieConsentModal } from "../components/CookieConsentModal.tsx";
import { suggestedCountryCode } from "../lib/countries.ts";
import { messages } from "./catalog.ts";
import { fmt } from "./fmt.ts";
import {
  type CookieConsent,
  initialLocaleState,
  persistConsent,
  persistLocale,
  readCookieConsent,
  readSavedLocale,
} from "./localePreference.ts";
import {
  LOCALES,
  detectPreferredLocale,
  type Locale,
} from "./locales.ts";
import type { Messages } from "./types.ts";

type I18nContextValue = {
  locale: Locale;
  localeTag: string;
  setLocale: (locale: Locale) => void;
  cookieConsent: CookieConsent;
  acceptLanguageCookies: () => void;
  declineLanguageCookies: () => void;
  t: Messages;
  fmt: typeof fmt;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [started] = useState(initialLocaleState);
  const [locale, setLocaleState] = useState<Locale>(started.locale);
  const [consent, setConsent] = useState<CookieConsent>(readCookieConsent);
  const explicitChoice = useRef(started.fromSaved);
  const userCountry = session?.user?.country;

  const setLocale = useCallback(
    (next: Locale) => {
      explicitChoice.current = true;
      setLocaleState(next);
      persistLocale(next, consent);
    },
    [consent],
  );

  const acceptLanguageCookies = useCallback(() => {
    setConsent("accepted");
    persistConsent("accepted");
    persistLocale(locale, "accepted");
  }, [locale]);

  const declineLanguageCookies = useCallback(() => {
    setConsent("declined");
    persistConsent("declined");
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (explicitChoice.current) return;
    const next = detectPreferredLocale({
      savedLocale: readSavedLocale(),
      country: userCountry ?? suggestedCountryCode(),
    });
    setLocaleState(next);
    persistLocale(next, consent);
  }, [userCountry, consent]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      localeTag: LOCALES[locale].tag,
      setLocale,
      cookieConsent: consent,
      acceptLanguageCookies,
      declineLanguageCookies,
      t: messages[locale],
      fmt,
    }),
    [
      locale,
      setLocale,
      consent,
      acceptLanguageCookies,
      declineLanguageCookies,
    ],
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
      {consent === "unknown" ? (
        <CookieConsentModal
          title={messages[locale].cookies.title}
          body={messages[locale].cookies.body}
          acceptLabel={messages[locale].cookies.accept}
          declineLabel={messages[locale].cookies.decline}
          onAccept={acceptLanguageCookies}
          onDecline={declineLanguageCookies}
        />
      ) : null}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
