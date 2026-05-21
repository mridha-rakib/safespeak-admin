import type { AdminRole } from "@/lib/admin-auth";
import { APP_ROUTE_PATHS } from "@/routes/paths";

export const CLIENT_ADMIN_ROLES = [
  "super_admin",
  "content_admin",
  "integration_admin",
  "analytics_viewer",
] as const satisfies readonly AdminRole[];

export const ALL_ADMIN_ROLES = [
  "admin",
  ...CLIENT_ADMIN_ROLES,
] as const satisfies readonly AdminRole[];

export const SUPER_ADMIN_ROLES = ["super_admin"] as const satisfies readonly AdminRole[];
export const CONTENT_ADMIN_ROLES = ["super_admin", "content_admin"] as const satisfies readonly AdminRole[];
export const INTEGRATION_ADMIN_ROLES = ["super_admin", "integration_admin"] as const satisfies readonly AdminRole[];
export const ANALYTICS_ADMIN_ROLES = ["super_admin", "analytics_viewer"] as const satisfies readonly AdminRole[];

export function roleCanAccess(role: AdminRole | undefined, allowedRoles?: readonly AdminRole[]) {
  if (!role) {
    return false;
  }

  if (!allowedRoles?.length) {
    return ALL_ADMIN_ROLES.includes(role);
  }

  return allowedRoles.includes(role);
}

export function getDefaultAdminPathForRole(role: AdminRole | undefined) {
  if (role === "content_admin") {
    return APP_ROUTE_PATHS.adminContentEducationalContent;
  }

  if (role === "integration_admin") {
    return APP_ROUTE_PATHS.adminServiceDestinations;
  }

  if (role === "analytics_viewer") {
    return APP_ROUTE_PATHS.adminIncidentInsights;
  }

  return APP_ROUTE_PATHS.adminDashboard;
}
