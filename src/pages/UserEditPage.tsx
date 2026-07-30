import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type {
  OfficePosition,
  OfficeUser,
  OfficeUserContact,
} from "../gen/common/v1/office_pb.js";
import { OfficeUserRole } from "../gen/common/v1/office_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { EDITABLE_ROLES } from "../lib/roles.ts";
import { ContactModal } from "../components/ContactModal.tsx";
import {
  DeleteIcon,
  EditIcon,
  SpinnerIcon,
} from "../components/ActionIcons.tsx";
import "../styles/ui.css";

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { office } = useAuth();

  const [officeUser, setOfficeUser] = useState<OfficeUser | null>(null);
  const [positions, setPositions] = useState<OfficePosition[]>([]);
  const [contacts, setContacts] = useState<OfficeUserContact[]>([]);
  const [role, setRole] = useState<OfficeUserRole>(OfficeUserRole.USER);
  const [positionId, setPositionId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [contactBusyId, setContactBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<
    OfficeUserContact | null | undefined
  >(undefined);

  const load = useCallback(async () => {
    if (!id || !office) return;
    setLoading(true);
    setError(null);
    try {
      const [user, positionsRes, contactsRes] = await Promise.all([
        officeClient.getOfficeUser({ id }),
        officeClient.listOfficePositions({ officeId: office.id }),
        officeClient.listOfficeUserContacts({ officeUserId: id }),
      ]);
      setOfficeUser(user);
      setRole(user.role);
      setPositionId(user.positionId ?? "");
      setIsActive(user.isActive);
      setPositions(positionsRes.positions);
      setContacts(contactsRes.contacts);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, office]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!officeUser) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await officeClient.updateOfficeUser({
        id: officeUser.id,
        role,
        positionId: positionId || undefined,
        isActive,
      });
      setOfficeUser(updated);
      navigate("/users");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteContact(contact: OfficeUserContact) {
    if (!window.confirm("Delete this contact?")) return;
    setContactBusyId(contact.id);
    setError(null);
    try {
      await officeClient.deleteOfficeUserContact({ id: contact.id });
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setContactBusyId(null);
    }
  }

  if (!office) {
    return (
      <section className="page">
        <h1>Edit user</h1>
        <p className="empty-state">
          You need an office before managing users.{" "}
          <Link to="/office">Go to Office</Link>
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="page">
        <p className="page-lede">Loading user…</p>
      </section>
    );
  }

  if (!officeUser) {
    return (
      <section className="page">
        <div className="page-header">
          <h1>Edit user</h1>
          <div className="page-header__actions">
            <Link className="btn btn--ghost" to="/users">
              Cancel
            </Link>
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <p className="empty-state">Office user not found.</p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>Edit user</h1>
        <div className="page-header__actions">
          <button
            type="submit"
            form="user-edit-form"
            className="btn"
            disabled={busy}
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <Link className="btn btn--ghost" to="/users">
            Cancel
          </Link>
        </div>
      </div>

      <form id="user-edit-form" className="stack-form" onSubmit={onSave}>
        <label>
          Role
          <select
            value={role}
            onChange={(e) => setRole(Number(e.target.value) as OfficeUserRole)}
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
      </form>

      <div className="page-header" style={{ marginTop: "0.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-h)" }}>
          Contacts
        </h2>
        <div className="page-header__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setEditingContact(null)}
          >
            Add contact
          </button>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {contacts.length === 0 ? (
        <p className="empty-state">No contacts yet.</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Phone</th>
                <th>Description</th>
                <th>Primary</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>{contact.address || "—"}</td>
                  <td>{contact.phone || "—"}</td>
                  <td>{contact.description || "—"}</td>
                  <td>{contact.isPrimary ? "Yes" : "No"}</td>
                  <td>{contact.isActive ? "Yes" : "No"}</td>
                  <td>
                    <div className="data-table__actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost btn--icon"
                        onClick={() => setEditingContact(contact)}
                        aria-label="Edit contact"
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--danger btn--icon"
                        disabled={contactBusyId === contact.id}
                        onClick={() => void onDeleteContact(contact)}
                        aria-label="Delete contact"
                        title="Delete"
                      >
                        {contactBusyId === contact.id ? (
                          <SpinnerIcon />
                        ) : (
                          <DeleteIcon />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingContact !== undefined ? (
        <ContactModal
          officeUserId={officeUser.id}
          contact={editingContact}
          onClose={() => setEditingContact(undefined)}
          onSaved={(saved) => {
            setContacts((prev) => {
              const idx = prev.findIndex((c) => c.id === saved.id);
              if (idx === -1) return [...prev, saved];
              const next = [...prev];
              next[idx] = saved;
              return next;
            });
          }}
        />
      ) : null}
    </section>
  );
}
