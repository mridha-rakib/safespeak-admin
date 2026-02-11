import { APP_ROUTE_PATHS } from "@/routes/paths";

export type AdminSidebarItem = {
  label: string;
  to: string;
  exact?: boolean;
  showChevron?: boolean;
  tone?: "default" | "danger";
  children?: Array<{
    label: string;
    to: string;
  }>;
};

export const ADMIN_SIDEBAR_ITEMS: AdminSidebarItem[] = [
  {
    label: "Dashboard",
    to: APP_ROUTE_PATHS.adminDashboard,
    exact: true,
  },
  {
    label: "Users",
    to: APP_ROUTE_PATHS.adminUsers,
  },
  {
    label: "Insights",
    to: APP_ROUTE_PATHS.adminInsights,
    showChevron: true,
    children: [
      {
        label: "Incident Insight & Trends",
        to: APP_ROUTE_PATHS.adminInsightsIncidentTrends,
      },
      {
        label: "Patterns",
        to: APP_ROUTE_PATHS.adminInsightsPatterns,
      },
    ],
  },
  {
    label: "Create Admin",
    to: APP_ROUTE_PATHS.adminCreateAdmin,
  },
  {
    label: "Feedback",
    to: APP_ROUTE_PATHS.adminFeedback,
  },
  {
    label: "Settings",
    to: APP_ROUTE_PATHS.adminSettings,
  },
];

export const ADMIN_LOGOUT_ITEM: AdminSidebarItem = {
  label: "Logout",
  to: APP_ROUTE_PATHS.login,
  tone: "danger",
};
