import { useEffect, useState } from "react";
import type { User } from "../gen/common/v1/user_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { authClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { CountrySelect } from "../components/CountrySelect.tsx";
import { LanguageSwitcher } from "../components/LanguageSwitcher.tsx";
import { useI18n } from "../i18n/I18nContext.tsx";
import { displayCountry, optionalCountry, suggestedCountryCode } from "../lib/countries.ts";
import "../styles/ui.css";

type Mode = "view" | "edit";

type ProfileForm = {
  name: string;
  country: string;
};

function formFromUser(user: User, suggestCountry = false): ProfileForm {
  const country = user.country?.trim() ?? "";
  return {
    name: user.name,
    country: country || (suggestCountry ? (suggestedCountryCode() ?? "") : ""),
  };
}

export function SettingsPage() {
  const { session, updateUser } = useAuth();
  const { t, localeTag } = useI18n();
  const userId = session?.user?.id;
  const [profile, setProfile] = useState<User | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [form, setForm] = useState<ProfileForm>({ name: "", country: "" });
  const [loading, setLoading] = useState(!!userId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void authClient
      .getUser({ id: userId })
      .then((user) => {
        if (cancelled) return;
        setProfile(user);
        setForm(formFromUser(user));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err));
        setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  function startEdit() {
    if (!profile) return;
    setForm(formFromUser(profile, true));
    setError(null);
    // Wait until this click finishes so it cannot activate Save.
    window.setTimeout(() => setMode("edit"), 0);
  }

  function cancel() {
    if (profile) setForm(formFromUser(profile));
    setError(null);
    setMode("view");
  }

  async function save() {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await authClient.updateUser({
        name: form.name.trim(),
        country: optionalCountry(form.country),
      });
      setProfile(updated);
      setForm(formFromUser(updated));
      updateUser({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        country: updated.country,
      });
      setMode("view");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>{t.settings.title}</h1>
        {profile && mode === "edit" ? (
          <div className="page-header__actions">
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => void save()}
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
        ) : profile && !loading ? (
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

      {!userId ? (
        <p className="empty-state">{t.settings.noProfile}</p>
      ) : loading ? (
        <p className="page-lede">{t.settings.loading}</p>
      ) : mode === "edit" && profile ? (
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
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
            <input type="email" value={profile.email} disabled />
          </label>
          <label>
            {t.settings.country}
            <CountrySelect
              value={form.country}
              onChange={(country) => setForm({ ...form, country })}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
        </form>
      ) : profile ? (
        <>
          {error ? <p className="error">{error}</p> : null}
          <dl className="detail-list">
            <div>
              <dt>{t.settings.name}</dt>
              <dd>{profile.name || t.common.empty}</dd>
            </div>
            <div>
              <dt>{t.settings.email}</dt>
              <dd>{profile.email || t.common.empty}</dd>
            </div>
            <div>
              <dt>{t.settings.country}</dt>
              <dd>
                {displayCountry(profile.country, localeTag, t.common.empty)}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <>
          {error ? <p className="error">{error}</p> : null}
          <p className="empty-state">{t.settings.noProfile}</p>
        </>
      )}
    </section>
  );
}
