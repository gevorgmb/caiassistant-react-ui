const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const FALLBACK_REGION_CODES = [
  "AM",
  "RU",
  "US",
  "GB",
  "DE",
  "FR",
  "IT",
  "ES",
  "GE",
  "IR",
  "TR",
  "CN",
  "IN",
  "AE",
  "CA",
  "AU",
] as const;

let cachedRegionCodes: string[] | null = null;

function isAlpha2(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

export function regionCodes(): string[] {
  if (cachedRegionCodes) return cachedRegionCodes;

  try {
    const display = new Intl.DisplayNames(["en"], { type: "region" });
    const codes: string[] = [];
    for (const first of LETTERS) {
      for (const second of LETTERS) {
        const code = `${first}${second}`;
        const name = display.of(code);
        if (name && name !== code) {
          codes.push(code);
        }
      }
    }
    cachedRegionCodes = codes.length > 0 ? codes : [...FALLBACK_REGION_CODES];
  } catch {
    cachedRegionCodes = [...FALLBACK_REGION_CODES];
  }

  return cachedRegionCodes;
}

export function countryName(code: string, localeTag: string): string {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return code;
  try {
    return (
      new Intl.DisplayNames([localeTag], { type: "region" }).of(normalized) ??
      code
    );
  } catch {
    return code;
  }
}

export function sortedCountries(
  localeTag: string,
): { code: string; name: string }[] {
  return regionCodes()
    .map((code) => ({ code, name: countryName(code, localeTag) }))
    .sort((a, b) => a.name.localeCompare(b.name, localeTag));
}

export function displayCountry(
  value: string | undefined,
  localeTag: string,
  empty: string,
): string {
  const trimmed = value?.trim();
  if (!trimmed) return empty;
  if (isAlpha2(trimmed.toUpperCase())) {
    return countryName(trimmed, localeTag);
  }
  return trimmed;
}

export function optionalCountry(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function regionFromLocaleTag(
  tag: string,
  maximize: boolean,
): string | undefined {
  try {
    const locale = maximize
      ? new Intl.Locale(tag).maximize()
      : new Intl.Locale(tag);
    const region = locale.region?.toUpperCase();
    if (region && isAlpha2(region)) return region;
  } catch {
    return undefined;
  }
  return undefined;
}

function regionsFromNavigator(): string[] {
  if (typeof navigator === "undefined") return [];
  const tags = [...(navigator.languages ?? []), navigator.language].filter(
    (tag): tag is string => Boolean(tag),
  );
  const explicit: string[] = [];
  const likely: string[] = [];
  for (const tag of tags) {
    const region = regionFromLocaleTag(tag, false);
    if (region) explicit.push(region);
  }
  for (const tag of tags) {
    const region = regionFromLocaleTag(tag, true);
    if (region) likely.push(region);
  }
  return [...explicit, ...likely];
}

function countryFromTimeZone(timeZone: string | undefined): string | undefined {
  if (!timeZone) return undefined;
  return TIMEZONE_TO_COUNTRY[timeZone];
}

/**
 * Prefer an already-known country (e.g. the signed-in user).
 * Otherwise guess from timezone, then browser locale.
 */
export function suggestedCountryCode(preferred?: string): string | undefined {
  const fromPreferred = preferred?.trim();
  if (fromPreferred) {
    return isAlpha2(fromPreferred.toUpperCase())
      ? fromPreferred.toUpperCase()
      : fromPreferred;
  }

  const known = new Set(regionCodes());
  const timeZone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined;
  const candidates = [
    countryFromTimeZone(timeZone),
    ...regionsFromNavigator(),
  ];
  return candidates.find((code) => code != null && known.has(code));
}

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Africa/Cairo": "EG",
  "Africa/Casablanca": "MA",
  "Africa/Johannesburg": "ZA",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Bogota": "CO",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Mexico_City": "MX",
  "America/New_York": "US",
  "America/Sao_Paulo": "BR",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "Asia/Almaty": "KZ",
  "Asia/Baghdad": "IQ",
  "Asia/Baku": "AZ",
  "Asia/Bangkok": "TH",
  "Asia/Beirut": "LB",
  "Asia/Dhaka": "BD",
  "Asia/Dubai": "AE",
  "Asia/Hong_Kong": "HK",
  "Asia/Irkutsk": "RU",
  "Asia/Jakarta": "ID",
  "Asia/Jerusalem": "IL",
  "Asia/Kabul": "AF",
  "Asia/Karachi": "PK",
  "Asia/Kolkata": "IN",
  "Asia/Krasnoyarsk": "RU",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Kuwait": "KW",
  "Asia/Magadan": "RU",
  "Asia/Manila": "PH",
  "Asia/Nicosia": "CY",
  "Asia/Novosibirsk": "RU",
  "Asia/Qatar": "QA",
  "Asia/Riyadh": "SA",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Singapore": "SG",
  "Asia/Tashkent": "UZ",
  "Asia/Tbilisi": "GE",
  "Asia/Tehran": "IR",
  "Asia/Tokyo": "JP",
  "Asia/Vladivostok": "RU",
  "Asia/Yekaterinburg": "RU",
  "Asia/Yerevan": "AM",
  "Atlantic/Reykjavik": "IS",
  "Australia/Melbourne": "AU",
  "Australia/Sydney": "AU",
  "Europe/Amsterdam": "NL",
  "Europe/Athens": "GR",
  "Europe/Belgrade": "RS",
  "Europe/Berlin": "DE",
  "Europe/Brussels": "BE",
  "Europe/Bucharest": "RO",
  "Europe/Budapest": "HU",
  "Europe/Copenhagen": "DK",
  "Europe/Dublin": "IE",
  "Europe/Helsinki": "FI",
  "Europe/Istanbul": "TR",
  "Europe/Kaliningrad": "RU",
  "Europe/Kiev": "UA",
  "Europe/Kyiv": "UA",
  "Europe/Lisbon": "PT",
  "Europe/London": "GB",
  "Europe/Madrid": "ES",
  "Europe/Minsk": "BY",
  "Europe/Moscow": "RU",
  "Europe/Oslo": "NO",
  "Europe/Paris": "FR",
  "Europe/Prague": "CZ",
  "Europe/Riga": "LV",
  "Europe/Rome": "IT",
  "Europe/Samara": "RU",
  "Europe/Sofia": "BG",
  "Europe/Stockholm": "SE",
  "Europe/Tallinn": "EE",
  "Europe/Vienna": "AT",
  "Europe/Vilnius": "LT",
  "Europe/Warsaw": "PL",
  "Europe/Zurich": "CH",
  "Pacific/Auckland": "NZ",
};
