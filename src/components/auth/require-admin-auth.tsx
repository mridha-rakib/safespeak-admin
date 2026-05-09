import { ensureValidAdminSession } from "@/lib/admin-auth";
import { APP_ROUTE_PATHS } from "@/routes/paths";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

type RequireAdminAuthProps = {
  children: ReactNode;
};

export function RequireAdminAuth({ children }: RequireAdminAuthProps) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const session = await ensureValidAdminSession();

        if (isMounted) {
          setIsAuthenticated(Boolean(session));
        }
      }
      catch {
        if (isMounted) {
          setIsAuthenticated(false);
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

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTE_PATHS.login} replace state={{ from: location.pathname }} />;
  }

  return children;
}
