import { ensureValidAdminSession, type AdminAuthSession, type AdminRole } from "@/lib/admin-auth";
import { getDefaultAdminPathForRole, roleCanAccess } from "@/lib/admin-rbac";
import { APP_ROUTE_PATHS } from "@/routes/paths";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

type RequireAdminAuthProps = {
  allowedRoles?: readonly AdminRole[];
  children: ReactNode;
};

export function RequireAdminAuth({ allowedRoles, children }: RequireAdminAuthProps) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [session, setSession] = useState<AdminAuthSession | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const session = await ensureValidAdminSession();

        if (isMounted) {
          setSession(session);
        }
      }
      catch {
        if (isMounted) {
          setSession(null);
        }
      }
      finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return null;
  }

  if (!session) {
    return <Navigate to={APP_ROUTE_PATHS.login} replace state={{ from: location.pathname }} />;
  }

  if (!roleCanAccess(session.user.role, allowedRoles)) {
    return <Navigate to={getDefaultAdminPathForRole(session.user.role)} replace />;
  }

  return children;
}
