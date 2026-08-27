import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";
import { useI18n } from "../i18n/I18nContext.tsx";
import { AppHeader } from "./AppHeader.tsx";
import { SideMenu } from "./SideMenu.tsx";
import "../styles/ui.css";
import "./AppLayout.css";

export function AppLayout() {
  const { error, clearError } = useAuth();
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <AppHeader />
      <div className="app-shell__body">
        <aside className="app-shell__sidebar">
          <SideMenu />
        </aside>
        <main className="app-shell__content">
          {error ? (
            <p className="error app-shell__banner" role="alert">
              {error}{" "}
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={clearError}
              >
                {t.common.dismiss}
              </button>
            </p>
          ) : null}
          <Suspense fallback={<p className="page-lede">{t.common.loading}</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
