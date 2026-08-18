import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Office } from "../gen/common/v1/office_pb.js";
import { authClient, officeClient } from "../api/client.ts";
import { errorMessage, isUnauthenticated } from "../api/errors.ts";
import {
  AUTH_EXPIRED_EVENT,
  clearSession,
  isSessionValid,
  loadSession,
  notifyAuthExpired,
  saveSession,
  type Session,
  type SessionUser,
} from "../api/session.ts";

type AuthContextValue = {
  session: Session | null;
  office: Office | null;
  officeLoading: boolean;
  busy: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshOffice: () => Promise<void>;
  setOffice: (office: Office | null) => void;
  updateUser: (user: SessionUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function sessionFromToken(token: {
  accessToken: string;
  tokenType: string;
  expiresIn: bigint | number | string;
  user?: { id: string; email: string; name: string } | undefined;
}): Session {
  const expiresInSeconds = Number(token.expiresIn);
  return {
    accessToken: token.accessToken,
    tokenType: token.tokenType,
    expiresIn: token.expiresIn.toString(),
    expiresAt: Date.now() + expiresInSeconds * 1000,
    user: token.user
      ? {
          id: token.user.id,
          email: token.user.email,
          name: token.user.name,
        }
      : undefined,
  };
}

function dropLocalSession(
  setSession: (session: Session | null) => void,
  setOffice: (office: Office | null) => void,
  setOfficeLoading: (loading: boolean) => void,
) {
  clearSession();
  setSession(null);
  setOffice(null);
  setOfficeLoading(false);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [office, setOffice] = useState<Office | null>(null);
  const [officeLoading, setOfficeLoading] = useState(() => !!loadSession());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearLocalSession = useCallback(() => {
    dropLocalSession(setSession, setOffice, setOfficeLoading);
  }, []);

  // React to expired/missing tokens (interceptor or timer).
  useEffect(() => {
    const onExpired = () => {
      setError(null);
      dropLocalSession(setSession, setOffice, setOfficeLoading);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  // Proactively log out when the stored token reaches expiresAt.
  useEffect(() => {
    if (!session || !isSessionValid(session)) {
      if (session) {
        notifyAuthExpired();
      }
      return;
    }

    const msUntilExpiry = session.expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      notifyAuthExpired();
      return;
    }

    const timer = window.setTimeout(() => {
      notifyAuthExpired();
    }, msUntilExpiry);

    return () => window.clearTimeout(timer);
  }, [session]);

  const refreshOffice = useCallback(async () => {
    if (!loadSession()?.accessToken) {
      clearLocalSession();
      return;
    }
    setOfficeLoading(true);
    try {
      const res = await officeClient.getUserOffices({});
      setOffice(res.offices[0] ?? null);
    } catch (err) {
      if (isUnauthenticated(err) || !loadSession()) {
        clearLocalSession();
        return;
      }
      setError(errorMessage(err));
      setOffice(null);
    } finally {
      setOfficeLoading(false);
    }
  }, [clearLocalSession]);

  useEffect(() => {
    if (!session) {
      setOffice(null);
      setOfficeLoading(false);
      return;
    }
    void refreshOffice();
  }, [session, refreshOffice]);

  const login = useCallback(async (email: string, password: string) => {
    setBusy(true);
    setError(null);
    try {
      const token = await authClient.login({ email, password });
      const next = sessionFromToken(token);
      if (!next.accessToken) {
        throw new Error("Login succeeded but no access token was returned");
      }
      saveSession(next);
      setOfficeLoading(true);
      setSession(next);
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    } finally {
      setBusy(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setBusy(true);
      setError(null);
      try {
        const token = await authClient.register({ email, password, name });
        const next = sessionFromToken(token);
        if (!next.accessToken) {
          throw new Error("Register succeeded but no access token was returned");
        }
        saveSession(next);
        setOfficeLoading(true);
        setSession(next);
      } catch (err) {
        setError(errorMessage(err));
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const accessToken = session?.accessToken ?? "";
      if (accessToken) {
        await authClient.logout({ accessToken });
      }
    } catch (err) {
      // Still clear locally even if revoke fails (e.g. already expired).
      if (!isUnauthenticated(err)) {
        setError(errorMessage(err));
      }
    } finally {
      clearLocalSession();
      setBusy(false);
    }
  }, [session?.accessToken, clearLocalSession]);

  const updateUser = useCallback(
    (user: SessionUser) => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = { ...prev, user };
        saveSession(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      office,
      officeLoading,
      busy,
      error,
      clearError: () => setError(null),
      login,
      register,
      logout,
      refreshOffice,
      setOffice,
      updateUser,
    }),
    [
      session,
      office,
      officeLoading,
      busy,
      error,
      login,
      register,
      logout,
      refreshOffice,
      updateUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
