const TOKEN_KEY = "cai.access_token";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export type Session = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user?: SessionUser;
};

export function loadSession(): Session | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
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
