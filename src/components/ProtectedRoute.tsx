import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import type { StaffRole } from "../types/staff";

interface ProtectedRouteProps {
  allowedRoles?: StaffRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ allowedRoles, redirectTo = "/admin" }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasRole = useAuthStore((state) => state.hasRole);

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
  if (allowedRoles && !hasRole(allowedRoles)) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
}