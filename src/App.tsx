import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPanel } from "./components/AuthPanel.tsx";
import { AppLayout } from "./layout/AppLayout.tsx";
import { RequireAuth } from "./auth/RequireAuth.tsx";
import { OfficePage } from "./pages/OfficePage.tsx";
import { UsersPage } from "./pages/UsersPage.tsx";
import { UserNewPage } from "./pages/UserNewPage.tsx";
import { UserEditPage } from "./pages/UserEditPage.tsx";
import { PositionsPage } from "./pages/PositionsPage.tsx";
import { PositionFormPage } from "./pages/PositionFormPage.tsx";
import { SettingsPage } from "./pages/SettingsPage.tsx";
import { SchedulePage } from "./pages/SchedulePage.tsx";
import "./App.css";

function LoginPage() {
  return (
    <main className="login-page">
      <header className="login-page__header">
        <p className="brand">Clerk AI Assistant</p>
        <p className="subtitle">Sign in to manage your office</p>
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
          <Route path="/schedule" element={<SchedulePage />} />
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
