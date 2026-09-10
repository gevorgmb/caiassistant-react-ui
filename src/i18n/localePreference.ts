import { deleteCookie, readCookie, writeCookie } from "../lib/cookies.ts";
import { suggestedCountryCode } from "../lib/countries.ts";
import { loadSession } from "../api/session.ts";
import {
  detectPreferredLocale,
  isLocale,
  type Locale,
} from "./locales.ts";

export const LOCALE_COOKIE = "cai.locale";
export const CONSENT_COOKIE = "cai.cookie-consent";
const LEGACY_STORAGE_KEY = "clerk.locale";

export type CookieConsent = "unknown" | "accepted" | "declined";

export function readCookieConsent(): CookieConsent {
  const value = readCookie(CONSENT_COOKIE);
  if (value === "accepted" || value === "declined") return value;
  if (isLocale(readCookie(LOCALE_COOKIE))) return "accepted";
  return "unknown";
}

export function readSavedLocale(): Locale | null {
  const fromCookie = readCookie(LOCALE_COOKIE);
  return isLocale(fromCookie) ? fromCookie : null;
}

function consumeLegacyLocale(): Locale | null {
  try {
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return isLocale(legacy) ? legacy : null;
  } catch {
    return null;
  }
}

export function persistLocale(locale: Locale, consent: CookieConsent): void {
  if (consent !== "accepted") return;
  writeCookie(LOCALE_COOKIE, locale);
}

export function persistConsent(consent: Exclude<CookieConsent, "unknown">): void {
  writeCookie(CONSENT_COOKIE, consent);
  if (consent === "declined") {
    deleteCookie(LOCALE_COOKIE);
  }
}

export function initialLocaleState(): {
  locale: Locale;
  fromSaved: boolean;
} {
  const saved = readSavedLocale() ?? consumeLegacyLocale();
  return {
    fromSaved: saved != null,
    locale: detectPreferredLocale({
      savedLocale: saved,
      country: loadSession()?.user?.country ?? suggestedCountryCode(),
    }),
  };
}
