import { useEffect, useState, type SubmitEvent } from "react";
import { useAuth } from "../auth/AuthContext.tsx";
import "../styles/ui.css";

type Mode = "view" | "edit";

type ProfileForm = {
  name: string;
  email: string;
};

export function SettingsPage() {
  const { session, updateUser } = useAuth();
  const user = session?.user;
  const [mode, setMode] = useState<Mode>("view");
  const [form, setForm] = useState<ProfileForm>({ name: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "view" && user) {
      setForm({ name: user.name, email: user.email });
    }
  }, [user, mode]);

  function startEdit() {
    if (!user) return;
    setForm({ name: user.name, email: user.email });
    setError(null);
    setMode("edit");
  }

  function cancel() {
    setError(null);
    setMode("view");
  }

  function onSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      updateUser({
        id: user.id,
        name: form.name.trim(),
        email: form.email.trim(),
      });
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <section className="page">
        <h1>Settings</h1>
        <p className="empty-state">No user profile is available for this session.</p>
      </section>
    );
  }

  if (mode === "edit") {
    return (
      <section className="page">
        <div className="page-header">
          <h1>Settings</h1>
          <div className="page-header__actions">
            <button
              type="submit"
              form="settings-form"
              className="btn"
              disabled={busy}
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy}
              onClick={cancel}
            >
              Cancel
            </button>
          </div>
        </div>

        <form id="settings-form" className="stack-form" onSubmit={onSave}>
          <label>
            User ID
            <input value={user.id} disabled />
          </label>
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
        </form>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>Settings</h1>
        <div className="page-header__actions">
          <button type="button" className="btn" onClick={startEdit}>
            Edit
          </button>
        </div>
      </div>

      <dl className="detail-list">
        <div>
          <dt>User ID</dt>
          <dd>
            <code>{user.id}</code>
          </dd>
        </div>
        <div>
          <dt>Name</dt>
          <dd>{user.name || "—"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user.email || "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
