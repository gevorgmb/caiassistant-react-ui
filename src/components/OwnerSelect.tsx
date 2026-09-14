import type { Office } from "../gen/common/v1/office_pb.js";
import { useI18n } from "../i18n/I18nContext.tsx";
import type { OwnerFilter } from "../lib/ownership.ts";
import { isPersonalOfficeId } from "../lib/ownership.ts";

type OwnerSelectProps = {
  value: string;
  onChange: (officeId: string) => void;
  office: Office | null;
  disabled?: boolean;
};

export function OwnerSelect({
  value,
  onChange,
  office,
  disabled,
}: OwnerSelectProps) {
  const { t } = useI18n();
  const selected = office && value === office.id ? office.id : "";

  return (
    <label>
      {t.common.owner}
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || !office}
      >
        <option value="">{t.common.personal}</option>
        {office ? <option value={office.id}>{office.name}</option> : null}
      </select>
    </label>
  );
}

type OwnerFilterSelectProps = {
  value: OwnerFilter;
  onChange: (filter: OwnerFilter) => void;
  office: Office | null;
  disabled?: boolean;
};

export function OwnerFilterSelect({
  value,
  onChange,
  office,
  disabled,
}: OwnerFilterSelectProps) {
  const { t } = useI18n();
  const selected = !office && value === "office" ? "all" : value;

  return (
    <div className="filter-row">
      <label>
        {t.common.owner}
        <select
          value={selected}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as OwnerFilter)}
        >
          <option value="all">{t.common.all}</option>
          <option value="personal">{t.common.personal}</option>
          {office ? (
            <option value="office">{office.name}</option>
          ) : null}
        </select>
      </label>
    </div>
  );
}

export function ownerLabel(
  officeId: string | undefined,
  office: Office | null,
  personalLabel: string,
  officeFallback: string,
): string {
  if (isPersonalOfficeId(officeId)) return personalLabel;
  if (office && office.id === officeId) return office.name;
  return officeFallback;
}
