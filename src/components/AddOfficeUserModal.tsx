import { useEffect, useState, type SubmitEvent } from "react";
import type { OfficePosition } from "../gen/common/v1/office_pb.js";
import { OfficeUserRole } from "../gen/common/v1/office_pb.js";
import type { User } from "../gen/common/v1/user_pb.js";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { EDITABLE_ROLES } from "../lib/roles.ts";
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
        <h2 id="add-office-user-title">Add user to office</h2>
        <p className="page-lede">
          {user.name || "—"} ({user.email || "—"})
        </p>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            Role
            <select
              value={role}
              onChange={(e) =>
                setRole(Number(e.target.value) as OfficeUserRole)
              }
            >
              {EDITABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Position
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
            >
              <option value="">No position</option>
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
            Active
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
