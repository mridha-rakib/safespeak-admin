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
    label: "Content Management",
    to: APP_ROUTE_PATHS.adminContentManagement,
    showChevron: true,
    children: [
      {
        label: "Landing Page",
        to: APP_ROUTE_PATHS.adminContentLandingPage,
      },
      {
        label: "Media Asset",
        to: APP_ROUTE_PATHS.adminContentMediaAsset,
      },
      {
        label: "Knowledge Sources",
        to: APP_ROUTE_PATHS.adminContentKnowledgeSources,
      },
      {
        label: "Resource Library",
        to: APP_ROUTE_PATHS.adminContentResourceLibrary,
      },
      {
        label: "Upload Resource",
        to: APP_ROUTE_PATHS.adminContentUploadResource,
      },
      {
        label: "Educational Content",
        to: APP_ROUTE_PATHS.adminContentEducationalContent,
      },
    ],
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
    label: "Earnings",
    to: APP_ROUTE_PATHS.adminEarnings,
  },
  {
    label: "Subscriptions",
    to: APP_ROUTE_PATHS.adminSubscriptions,
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
