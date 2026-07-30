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
import { errorMessage } from "../api/errors.ts";
import {
  clearSession,
  loadSession,
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
  return {
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
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [office, setOffice] = useState<Office | null>(null);
  const [officeLoading, setOfficeLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshOffice = useCallback(async () => {
    if (!loadSession()?.accessToken) {
      setOffice(null);
      return;
    }
    setOfficeLoading(true);
    try {
      const res = await officeClient.getUserOffices({});
      setOffice(res.offices[0] ?? null);
    } catch (err) {
      setError(errorMessage(err));
      setOffice(null);
    } finally {
      setOfficeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setOffice(null);
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
      saveSession(next);
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
        saveSession(next);
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
      await authClient.logout({ accessToken });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      clearSession();
      setSession(null);
      setOffice(null);
      setBusy(false);
    }
  }, [session?.accessToken]);

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
