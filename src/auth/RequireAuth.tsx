import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";

export function RequireAuth() {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
