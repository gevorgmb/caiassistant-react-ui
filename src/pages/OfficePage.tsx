import { useEffect, useState, type SubmitEvent } from "react";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { useI18n } from "../i18n/I18nContext.tsx";
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
  const { t } = useI18n();
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
        <p className="page-lede">{t.office.loading}</p>
      </section>
    );
  }

  if (mode === "edit" || mode === "create") {
    return (
      <section className="page">
        <div className="page-header">
          <h1>{mode === "create" ? t.office.createTitle : t.office.editTitle}</h1>
          <div className="page-header__actions">
            <button
              type="submit"
              form="office-form"
              className="btn"
              disabled={busy}
            >
              {busy ? t.common.saving : t.common.save}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy}
              onClick={cancel}
            >
              {t.common.cancel}
            </button>
          </div>
        </div>

        <form id="office-form" className="stack-form" onSubmit={onSave}>
          <label>
            {t.office.name}
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            {t.office.phone}
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            {t.office.email}
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            {t.office.description}
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
          <h1>{t.office.title}</h1>
          <div className="page-header__actions">
            <button type="button" className="btn" onClick={startCreate}>
              {t.common.create}
            </button>
          </div>
        </div>
        <p className="empty-state">{t.office.empty}</p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>{t.office.title}</h1>
        <div className="page-header__actions">
          <button type="button" className="btn" onClick={startEdit}>
            {t.common.edit}
          </button>
        </div>
      </div>

      <dl className="detail-list">
        <div>
          <dt>{t.office.name}</dt>
          <dd>{office.name}</dd>
        </div>
        <div>
          <dt>{t.office.phone}</dt>
          <dd>{office.phone || t.common.empty}</dd>
        </div>
        <div>
          <dt>{t.office.email}</dt>
          <dd>{office.email || t.common.empty}</dd>
        </div>
        <div>
          <dt>{t.office.description}</dt>
          <dd>{office.description || t.common.empty}</dd>
        </div>
      </dl>
    </section>
  );
}
