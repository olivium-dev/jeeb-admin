import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Role } from "./types";

interface RequireAuthProps {
  children: ReactNode;
  roles?: Role[];
}

export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { status, session, hasAnyRole } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="grid h-screen place-items-center text-fg-faint">
        Loading…
      </div>
    );
  }

  if (status === "anonymous" || !session) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return <Forbidden />;
  }

  return <>{children}</>;
}

function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-xl font-semibold text-fg">403 · Access denied</h1>
      <p className="max-w-md text-fg-muted">
        This page exists but your role doesn’t include it. Ask a superuser to
        grant the required permission.
      </p>
    </div>
  );
}
