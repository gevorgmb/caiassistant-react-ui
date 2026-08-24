import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";
import { LanguageSwitcher } from "../components/LanguageSwitcher.tsx";
import { useI18n } from "../i18n/I18nContext.tsx";
import "./AppHeader.css";

export function AppHeader() {
  const { session, office, officeLoading, busy, logout } = useAuth();
  const { t } = useI18n();
  const userName = session?.user?.name || session?.user?.email || t.common.user;

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true" />
        <span className="app-header__title">{t.app.title}</span>
      </div>

      <div className="app-header__office">
        {officeLoading ? (
          <span className="app-header__office-muted">{t.header.loadingOffice}</span>
        ) : office ? (
          <p className="app-header__office-text">
            <span className="app-header__office-label">{t.header.yourOffice}</span>{" "}
            <span className="app-header__office-name">{office.name}</span>
          </p>
        ) : (
          <p className="app-header__office-text">
            {t.header.notRelated}{" "}
            <Link to="/office">{t.header.createOne}</Link>
          </p>
        )}
      </div>

      <div className="app-header__user">
        <LanguageSwitcher />
        <span className="app-header__user-name" title={session?.user?.email}>
          {userName}
        </span>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => void logout()}
        >
          {busy ? t.header.signingOut : t.header.logOut}
        </button>
      </div>
    </header>
  );
}
