import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";
import "./AppHeader.css";

export function AppHeader() {
  const { session, office, officeLoading, busy, logout } = useAuth();
  const userName = session?.user?.name || session?.user?.email || "User";

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true" />
        <span className="app-header__title">Clerk AI Assistant</span>
      </div>

      <div className="app-header__office">
        {officeLoading ? (
          <span className="app-header__office-muted">Loading office…</span>
        ) : office ? (
          <p className="app-header__office-text">
            <span className="app-header__office-label">Your Office:</span>{" "}
            <span className="app-header__office-name">{office.name}</span>
          </p>
        ) : (
          <p className="app-header__office-text">
            You are not related to an office.{" "}
            <Link to="/office">Create one</Link>
          </p>
        )}
      </div>

      <div className="app-header__user">
        <span className="app-header__user-name" title={session?.user?.email}>
          {userName}
        </span>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => void logout()}
        >
          {busy ? "Signing out…" : "Log out"}
        </button>
      </div>
    </header>
  );
}
