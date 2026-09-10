import { useMemo } from "react";
import { useI18n } from "../i18n/I18nContext.tsx";
import { sortedCountries } from "../lib/countries.ts";

type CountrySelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
};

export function CountrySelect({
  value,
  onChange,
  disabled,
  required,
  id,
  name,
}: CountrySelectProps) {
  const { t, localeTag } = useI18n();
  const countries = useMemo(() => sortedCountries(localeTag), [localeTag]);
  const normalized = /^[a-z]{2}$/i.test(value) ? value.toUpperCase() : value;
  const known = countries.some((country) => country.code === normalized);

  return (
    <select
      id={id}
      name={name}
      value={normalized}
      required={required}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{t.common.empty}</option>
      {!known && normalized ? (
        <option value={normalized}>{normalized}</option>
      ) : null}
      {countries.map((country) => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
    </select>
  );
}
