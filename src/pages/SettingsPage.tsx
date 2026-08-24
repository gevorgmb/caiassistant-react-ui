import { useEffect, useState, type SubmitEvent } from "react";
import { useAuth } from "../auth/AuthContext.tsx";
import { LanguageSwitcher } from "../components/LanguageSwitcher.tsx";
import { useI18n } from "../i18n/I18nContext.tsx";
import "../styles/ui.css";

type Mode = "view" | "edit";

type ProfileForm = {
  name: string;
  email: string;
};

export function SettingsPage() {
  const { session, updateUser } = useAuth();
  const { t } = useI18n();
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
      setError(err instanceof Error ? err.message : t.common.failedToSave);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>{t.settings.title}</h1>
        {user && mode === "edit" ? (
          <div className="page-header__actions">
            <button
              type="submit"
              form="settings-form"
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
        ) : user ? (
          <div className="page-header__actions">
            <button type="button" className="btn" onClick={startEdit}>
              {t.common.edit}
            </button>
          </div>
        ) : null}
      </div>

      <div className="stack-form">
        <LanguageSwitcher labeled />
      </div>

      {!user ? (
        <p className="empty-state">{t.settings.noProfile}</p>
      ) : mode === "edit" ? (
        <form id="settings-form" className="stack-form" onSubmit={onSave}>
          <label>
            {t.settings.userId}
            <input value={user.id} disabled />
          </label>
          <label>
            {t.settings.name}
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            {t.settings.email}
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
        </form>
      ) : (
        <dl className="detail-list">
          <div>
            <dt>{t.settings.userId}</dt>
            <dd>
              <code>{user.id}</code>
            </dd>
          </div>
          <div>
            <dt>{t.settings.name}</dt>
            <dd>{user.name || t.common.empty}</dd>
          </div>
          <div>
            <dt>{t.settings.email}</dt>
            <dd>{user.email || t.common.empty}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
