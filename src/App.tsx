import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, type ComponentType } from "react";
import { AuthPanel } from "./components/AuthPanel.tsx";
import { LanguageSwitcher } from "./components/LanguageSwitcher.tsx";
import { AppLayout } from "./layout/AppLayout.tsx";
import { RequireAuth } from "./auth/RequireAuth.tsx";
import { useI18n } from "./i18n/I18nContext.tsx";
import "./App.css";
import "./styles/ui.css";

function lazyNamed<ExportName extends string>(
  importer: () => Promise<Record<ExportName, ComponentType>>,
  exportName: ExportName,
) {
  return lazy(() =>
    importer().then((mod) => ({ default: mod[exportName] })),
  );
}

const AiAssistantPage = lazyNamed(
  () => import("./pages/AiAssistantPage.tsx"),
  "AiAssistantPage",
);
const AiAssistantFunctionPage = lazyNamed(
  () => import("./pages/AiAssistantFunctionPage.tsx"),
  "AiAssistantFunctionPage",
);
const SchedulePage = lazyNamed(
  () => import("./pages/SchedulePage.tsx"),
  "SchedulePage",
);
const TodoListPage = lazyNamed(
  () => import("./pages/TodoListPage.tsx"),
  "TodoListPage",
);
const TodoListFormPage = lazyNamed(
  () => import("./pages/TodoListFormPage.tsx"),
  "TodoListFormPage",
);
const OfficePage = lazyNamed(() => import("./pages/OfficePage.tsx"), "OfficePage");
const UsersPage = lazyNamed(() => import("./pages/UsersPage.tsx"), "UsersPage");
const UserNewPage = lazyNamed(
  () => import("./pages/UserNewPage.tsx"),
  "UserNewPage",
);
const UserEditPage = lazyNamed(
  () => import("./pages/UserEditPage.tsx"),
  "UserEditPage",
);
const PositionsPage = lazyNamed(
  () => import("./pages/PositionsPage.tsx"),
  "PositionsPage",
);
const PositionFormPage = lazyNamed(
  () => import("./pages/PositionFormPage.tsx"),
  "PositionFormPage",
);
const SettingsPage = lazyNamed(
  () => import("./pages/SettingsPage.tsx"),
  "SettingsPage",
);

function LoginPage() {
  const { t } = useI18n();
  return (
    <main className="login-page">
      <div className="login-page__toolbar">
        <LanguageSwitcher />
      </div>
      <header className="login-page__header">
        <p className="brand">{t.app.title}</p>
        <p className="subtitle">{t.app.signInSubtitle}</p>
      </header>
      <AuthPanel />
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/ai-assistant" element={<AiAssistantPage />} />
          <Route
            path="/ai-assistant/:functionId/:documentId"
            element={<AiAssistantFunctionPage />}
          />
          <Route
            path="/ai-assistant/:functionId"
            element={<AiAssistantFunctionPage />}
          />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/todolist" element={<TodoListPage />} />
          <Route path="/todolist/new" element={<TodoListFormPage />} />
          <Route path="/todolist/:id" element={<TodoListFormPage />} />
          <Route path="/office" element={<OfficePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/new" element={<UserNewPage />} />
          <Route path="/users/:id" element={<UserEditPage />} />
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="/positions/new" element={<PositionFormPage />} />
          <Route path="/positions/:id" element={<PositionFormPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
