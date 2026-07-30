import { useEffect, useState, type SubmitEvent } from "react";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import "../styles/ui.css";

type Mode = "view" | "edit" | "create";

type OfficeFormState = {
  name: string;
  phone: string;
  email: string;
  description: string;
};

const emptyForm: OfficeFormState = {
  name: "",
  phone: "",
  email: "",
  description: "",
};

export function OfficePage() {
  const { office, officeLoading, setOffice, refreshOffice } = useAuth();
  const [mode, setMode] = useState<Mode>("view");
  const [form, setForm] = useState<OfficeFormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "view" && office) {
      setForm({
        name: office.name,
        phone: office.phone ?? "",
        email: office.email ?? "",
        description: office.description ?? "",
      });
    }
  }, [office, mode]);

  function startEdit() {
    if (!office) return;
    setForm({
      name: office.name,
      phone: office.phone ?? "",
      email: office.email ?? "",
      description: office.description ?? "",
    });
    setError(null);
    setMode("edit");
  }

  function startCreate() {
    setForm(emptyForm);
    setError(null);
    setMode("create");
  }

  function cancel() {
    setError(null);
    setMode("view");
  }

  async function onSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        description: form.description.trim() || undefined,
      };
      if (mode === "create") {
        const created = await officeClient.createOffice(payload);
        setOffice(created);
      } else if (office) {
        const updated = await officeClient.updateOffice({
          id: office.id,
          ...payload,
        });
        setOffice(updated);
      }
      await refreshOffice();
      setMode("view");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (officeLoading && mode === "view") {
    return (
      <section className="page">
        <p className="page-lede">Loading office…</p>
      </section>
    );
  }

  if (mode === "edit" || mode === "create") {
    return (
      <section className="page">
        <div className="page-header">
          <h1>{mode === "create" ? "Create office" : "Edit office"}</h1>
          <div className="page-header__actions">
            <button
              type="submit"
              form="office-form"
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

        <form id="office-form" className="stack-form" onSubmit={onSave}>
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
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
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
          {error ? <p className="error">{error}</p> : null}
        </form>
      </section>
    );
  }

  if (!office) {
    return (
      <section className="page">
        <div className="page-header">
          <h1>Office</h1>
          <div className="page-header__actions">
            <button type="button" className="btn" onClick={startCreate}>
              Create
            </button>
          </div>
        </div>
        <p className="empty-state">
          You are not related to an office yet. Create one to get started.
        </p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>Office</h1>
        <div className="page-header__actions">
          <button type="button" className="btn" onClick={startEdit}>
            Edit
          </button>
        </div>
      </div>

      <dl className="detail-list">
        <div>
          <dt>Name</dt>
          <dd>{office.name}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{office.phone || "—"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{office.email || "—"}</dd>
        </div>
        <div>
          <dt>Description</dt>
          <dd>{office.description || "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
