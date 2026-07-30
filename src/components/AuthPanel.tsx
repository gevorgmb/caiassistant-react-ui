import { useState, type SubmitEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";
import "./AuthPanel.css";

type Mode = "login" | "register";

export function AuthPanel() {
  const { session, busy, error, clearError, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (session) {
    return <Navigate to="/office" replace />;
  }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      setPassword("");
    } catch {
      // error is surfaced via AuthContext
    }
  }

  return (
    <section className="auth-panel">
      <h1>{mode === "login" ? "Log in" : "Create account"}</h1>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? "active" : undefined}
          onClick={() => {
            setMode("login");
            clearError();
          }}
        >
          Log in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          className={mode === "register" ? "active" : undefined}
          onClick={() => {
            setMode("register");
            clearError();
          }}
        >
          Register
        </button>
      </div>

      <form onSubmit={onSubmit}>
        {mode === "register" ? (
          <label>
            Name
            <input
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        ) : null}

        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={busy}>
          {busy
            ? "Working…"
            : mode === "login"
              ? "Log in"
              : "Register"}
        </button>
      </form>
    </section>
  );
}
