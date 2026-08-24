import { useEffect, useState, type SubmitEvent } from "react";
import type { OfficePosition } from "../gen/common/v1/office_pb.js";
import { OfficeUserRole } from "../gen/common/v1/office_pb.js";
import type { User } from "../gen/common/v1/user_pb.js";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { EDITABLE_ROLES, roleLabel } from "../lib/roles.ts";
import { useI18n } from "../i18n/I18nContext.tsx";
import "../styles/ui.css";

type AddOfficeUserModalProps = {
  officeId: string;
  user: User;
  positions: OfficePosition[];
  onClose: () => void;
  onSaved: () => void;
};

export function AddOfficeUserModal({
  officeId,
  user,
  positions,
  onClose,
  onSaved,
}: AddOfficeUserModalProps) {
  const { t } = useI18n();
  const [role, setRole] = useState<OfficeUserRole>(OfficeUserRole.USER);
  const [positionId, setPositionId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await officeClient.createOfficeUser({
        officeId,
        userId: user.id,
        role,
        positionId: positionId || undefined,
        isActive,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-office-user-title"
      >
        <h2 id="add-office-user-title">{t.users.addToOffice}</h2>
        <p className="page-lede">
          {user.name || t.common.empty} ({user.email || t.common.empty})
        </p>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            {t.users.role}
            <select
              value={role}
              onChange={(e) =>
                setRole(Number(e.target.value) as OfficeUserRole)
              }
            >
              {EDITABLE_ROLES.map((value) => (
                <option key={value} value={value}>
                  {roleLabel(value, t)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.users.position}
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
            >
              <option value="">{t.users.noPosition}</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            {t.users.active}
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy}
              onClick={onClose}
            >
              {t.common.cancel}
            </button>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
