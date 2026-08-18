const TOKEN_KEY = "cai.access_token";

export const AUTH_EXPIRED_EVENT = "cai:auth-expired";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export type Session = {
  accessToken: string;
  tokenType: string;
  /** Seconds until expiry at the time the token was issued. */
  expiresIn: string;
  /** Absolute expiry time in ms since epoch. */
  expiresAt: number;
  user?: SessionUser;
};

export function isSessionValid(session: Session | null): session is Session {
  if (!session?.accessToken) return false;
  if (
    typeof session.expiresAt !== "number" ||
    !Number.isFinite(session.expiresAt) ||
    Date.now() >= session.expiresAt
  ) {
    return false;
  }
  return true;
}

export function loadSession(): Session | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    if (!isSessionValid(session)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Clear local session and notify the app that auth is no longer valid. */
export function notifyAuthExpired(): void {
  clearSession();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}
