import { useState, type SubmitEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";
import { EyeIcon, EyeOffIcon } from "./ActionIcons.tsx";
import "./AuthPanel.css";

type Mode = "login" | "register";

export function AuthPanel() {
  const { session, busy, error, clearError, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (session) {
    return <Navigate to="/schedule" replace />;
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
            setShowPassword(false);
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
            setShowPassword(false);
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
          <span className="password-field">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              className="password-field__toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </span>
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
