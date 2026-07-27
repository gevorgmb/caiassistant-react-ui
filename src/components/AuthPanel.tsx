import { useState, type SubmitEvent } from "react";
import { ConnectError } from "@connectrpc/connect";
import { authClient } from "../api/client.ts";
import {
  clearSession,
  loadSession,
  saveSession,
  type Session,
} from "../api/session.ts";
import "./AuthPanel.css";

type Mode = "login" | "register";

function errorMessage(err: unknown): string {
  if (err instanceof ConnectError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Unexpected error";
}

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(() =>
    loadSession(),
  );

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const token =
        mode === "login"
          ? await authClient.login({ email, password })
          : await authClient.register({ email, password, name });

      const next: Session = {
        accessToken: token.accessToken,
        tokenType: token.tokenType,
        expiresIn: token.expiresIn.toString(),
        user: token.user
          ? {
              id: token.user.id,
              email: token.user.email,
              name: token.user.name,
            }
          : undefined,
      };
      saveSession(next);
      setSession(next);
      setPassword("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    setBusy(true);
    setError(null);
    try {
      const accessToken = session?.accessToken ?? "";
      await authClient.logout(
        { accessToken },
        {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
        },
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      clearSession();
      setSession(null);
      setBusy(false);
    }
  }

  if (session) {
    return (
      <section className="auth-panel">
        <h1>Signed in</h1>
        <p className="lede">
          Session is stored locally and sent as a Bearer token on
          authenticated RPCs.
        </p>
        <dl className="session">
          <div>
            <dt>Name</dt>
            <dd>{session.user?.name || "—"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{session.user?.email || "—"}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>
              <code>{session.user?.id || "—"}</code>
            </dd>
          </div>
          <div>
            <dt>Token</dt>
            <dd>
              <code className="token">{session.accessToken}</code>
            </dd>
          </div>
        </dl>
        {error ? <p className="error">{error}</p> : null}
        <button type="button" disabled={busy} onClick={onLogout}>
          {busy ? "Signing out…" : "Log out"}
        </button>
      </section>
    );
  }

  return (
    <section className="auth-panel">
      <h1>{mode === "login" ? "Log in" : "Create account"}</h1>
      <p className="lede">
        Calls <code>auth.v1.AuthService</code> over gRPC-Web.
      </p>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? "active" : undefined}
          onClick={() => {
            setMode("login");
            setError(null);
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
            setError(null);
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
