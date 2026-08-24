import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPanel } from "./components/AuthPanel.tsx";
import { LanguageSwitcher } from "./components/LanguageSwitcher.tsx";
import { AppLayout } from "./layout/AppLayout.tsx";
import { RequireAuth } from "./auth/RequireAuth.tsx";
import { useI18n } from "./i18n/I18nContext.tsx";
import { OfficePage } from "./pages/OfficePage.tsx";
import { UsersPage } from "./pages/UsersPage.tsx";
import { UserNewPage } from "./pages/UserNewPage.tsx";
import { UserEditPage } from "./pages/UserEditPage.tsx";
import { PositionsPage } from "./pages/PositionsPage.tsx";
import { PositionFormPage } from "./pages/PositionFormPage.tsx";
import { SettingsPage } from "./pages/SettingsPage.tsx";
import { SchedulePage } from "./pages/SchedulePage.tsx";
import { TodoListPage } from "./pages/TodoListPage.tsx";
import { TodoListFormPage } from "./pages/TodoListFormPage.tsx";
import { AiAssistantPage } from "./pages/AiAssistantPage.tsx";
import { AiAssistantFunctionPage } from "./pages/AiAssistantFunctionPage.tsx";
import "./App.css";
import "./styles/ui.css";

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
