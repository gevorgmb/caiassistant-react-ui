import { useEffect, useState, type SubmitEvent } from "react";
import type { OfficeUserContact } from "../gen/common/v1/office_pb.js";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import "../styles/ui.css";

type ContactFormState = {
  address: string;
  phone: string;
  description: string;
  isActive: boolean;
  isPrimary: boolean;
};

type ContactModalProps = {
  officeUserId: string;
  contact: OfficeUserContact | null;
  onClose: () => void;
  onSaved: (contact: OfficeUserContact) => void;
};

export function ContactModal({
  officeUserId,
  contact,
  onClose,
  onSaved,
}: ContactModalProps) {
  const isCreate = contact === null;
  const [form, setForm] = useState<ContactFormState>({
    address: contact?.address ?? "",
    phone: contact?.phone ?? "",
    description: contact?.description ?? "",
    isActive: contact?.isActive ?? true,
    isPrimary: contact?.isPrimary ?? false,
  });
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
      const optional = {
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        description: form.description.trim() || undefined,
      };
      const saved = isCreate
        ? await officeClient.createOfficeUserContact({
            officeUserId,
            ...optional,
            isActive: form.isActive,
            isPrimary: form.isPrimary,
          })
        : await officeClient.updateOfficeUserContact({
            id: contact.id,
            ...optional,
            isActive: form.isActive,
            isPrimary: form.isPrimary,
          });
      onSaved(saved);
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
        aria-labelledby="contact-modal-title"
      >
        <h2 id="contact-modal-title">
          {isCreate ? "Add contact" : "Edit contact"}
        </h2>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            Address
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) =>
                setForm({ ...form, isPrimary: e.target.checked })
              }
            />
            Primary
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
