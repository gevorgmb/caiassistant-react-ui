import {
  LOCALES,
  LOCALE_CODES,
  type Locale,
} from "../i18n/locales.ts";
import { useI18n } from "../i18n/I18nContext.tsx";

type LanguageSwitcherProps = {
  labeled?: boolean;
};

export function LanguageSwitcher({ labeled = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  const select = (
    <select
      className="language-switcher"
      value={locale}
      aria-label={t.language.label}
      onChange={(event) => setLocale(event.target.value as Locale)}
    >
      {LOCALE_CODES.map((code) => (
        <option key={code} value={code}>
          {LOCALES[code].nativeName}
        </option>
      ))}
    </select>
  );

  if (!labeled) {
    return select;
  }

  return (
    <label>
      {t.language.label}
      {select}
    </label>
  );
}
