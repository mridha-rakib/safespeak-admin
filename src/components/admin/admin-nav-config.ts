import { APP_ROUTE_PATHS } from "@/routes/paths";
import type { AdminRole } from "@/lib/admin-auth";
import {
  ANALYTICS_ADMIN_ROLES,
  CONTENT_ADMIN_ROLES,
  INTEGRATION_ADMIN_ROLES,
  SUPER_ADMIN_ROLES,
} from "@/lib/admin-rbac";
import type { LucideIcon } from "lucide-react";
import {
  BadgeAlert,
  BrainCircuit,
  ChartColumnBig,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  SquareLibrary,
  UsersRound,
} from "lucide-react";

export type AdminSidebarItem = {
  label: string;
  to: string;
  icon?: LucideIcon;
  exact?: boolean;
  allowedRoles?: readonly AdminRole[];
  showChevron?: boolean;
  tone?: "default" | "danger";
  children?: Array<{
    label: string;
    to: string;
    allowedRoles?: readonly AdminRole[];
  }>;
};

export const ADMIN_SIDEBAR_ITEMS: AdminSidebarItem[] = [
  {
    label: "Dashboard",
    to: APP_ROUTE_PATHS.adminDashboard,
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Security & Compliance Center",
    to: APP_ROUTE_PATHS.adminSecurityCompliance,
    icon: ShieldCheck,
    showChevron: true,
    children: [
      {
        label: "Identity & Access Management",
        to: APP_ROUTE_PATHS.adminIdentityAccessManagement,
        allowedRoles: SUPER_ADMIN_ROLES,
      },
      {
        label: "Data Protection",
        to: APP_ROUTE_PATHS.adminDataProtection,
        allowedRoles: SUPER_ADMIN_ROLES,
      },
      {
        label: "Privacy Controls",
        to: APP_ROUTE_PATHS.adminPrivacyControls,
        allowedRoles: SUPER_ADMIN_ROLES,
      },
      {
        label: "Legal Compliance",
        to: APP_ROUTE_PATHS.adminLegalCompliance,
        allowedRoles: SUPER_ADMIN_ROLES,
      },
    ],
  },
  {
    label: "Platform Intelligence Engine",
    to: APP_ROUTE_PATHS.adminPlatformIntelligence,
    icon: BrainCircuit,
    showChevron: true,
    children: [
      {
        label: "Taxonomies",
        to: APP_ROUTE_PATHS.adminTaxonomiesManagement,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
      {
        label: "Service Destinations",
        to: APP_ROUTE_PATHS.adminServiceDestinations,
        allowedRoles: INTEGRATION_ADMIN_ROLES,
      },
      {
        label: "Integration Management",
        to: APP_ROUTE_PATHS.adminIntegrationManagement,
        allowedRoles: INTEGRATION_ADMIN_ROLES,
      },
      {
        label: "AI Engine Control",
        to: APP_ROUTE_PATHS.adminAiEngineControl,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
      {
        label: "Cultural Profiles",
        to: APP_ROUTE_PATHS.adminCulturalProfiles,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
      {
        label: "Language Packs",
        to: APP_ROUTE_PATHS.adminLanguagePacks,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
    ],
  },
  {
    label: "Analytics & Intelligence Center",
    to: APP_ROUTE_PATHS.adminInsights,
    icon: ChartColumnBig,
    showChevron: true,
    children: [
      {
        label: "Incident Insights",
        to: APP_ROUTE_PATHS.adminIncidentInsights,
        allowedRoles: ANALYTICS_ADMIN_ROLES,
      },
      {
        label: "Heatmaps",
        to: APP_ROUTE_PATHS.adminInsightsHeatmaps,
        allowedRoles: ANALYTICS_ADMIN_ROLES,
      },
      {
        label: "Trends",
        to: APP_ROUTE_PATHS.adminInsightsTrends,
        allowedRoles: ANALYTICS_ADMIN_ROLES,
      },
      {
        label: "Platform Health",
        to: APP_ROUTE_PATHS.adminPlatformHealth,
        allowedRoles: ANALYTICS_ADMIN_ROLES,
      },
    ],
  },
  {
    label: "Crisis & Safety Management",
    to: APP_ROUTE_PATHS.adminCrisisSafety,
    icon: BadgeAlert,
    showChevron: true,
    children: [
      {
        label: "Crisis Response Center",
        to: APP_ROUTE_PATHS.adminCrisisResponseCenter,
        allowedRoles: SUPER_ADMIN_ROLES,
      },
      {
        label: "Support Services",
        to: APP_ROUTE_PATHS.adminSupportServices,
        allowedRoles: INTEGRATION_ADMIN_ROLES,
      },
      {
        label: "Content Moderation",
        to: APP_ROUTE_PATHS.adminContentModeration,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
    ],
  },
  {
    label: "Content & Education Management",
    to: APP_ROUTE_PATHS.adminContentManagement,
    icon: SquareLibrary,
    showChevron: true,
    children: [
      {
        label: "Educational Content",
        to: APP_ROUTE_PATHS.adminContentEducationalContent,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
      {
        label: "Knowledge Sources",
        to: APP_ROUTE_PATHS.adminContentKnowledgeSources,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
      {
        label: "Resource Library",
        to: APP_ROUTE_PATHS.adminContentResourceLibrary,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
      {
        label: "Upload Resource",
        to: APP_ROUTE_PATHS.adminContentUploadResource,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
      {
        label: "Micro-Education Cards",
        to: APP_ROUTE_PATHS.adminContentMicroEducationCards,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
      {
        label: "Media Asset",
        to: APP_ROUTE_PATHS.adminContentMediaAsset,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
    ],
  },
  {
    label: "User & Operations Management",
    to: APP_ROUTE_PATHS.adminUsers,
    icon: UsersRound,
    showChevron: true,
    children: [
      {
        label: "Users",
        to: APP_ROUTE_PATHS.adminUsers,
        allowedRoles: SUPER_ADMIN_ROLES,
      },
      {
        label: "Feedback",
        to: APP_ROUTE_PATHS.adminFeedback,
        allowedRoles: SUPER_ADMIN_ROLES,
      },
      {
        label: "Create Admin",
        to: APP_ROUTE_PATHS.adminCreateAdmin,
        allowedRoles: SUPER_ADMIN_ROLES,
      },
      {
        label: "Audit Logs",
        to: APP_ROUTE_PATHS.adminAuditLogs,
        allowedRoles: SUPER_ADMIN_ROLES,
      },
    ],
  },
  {
    label: "Basic Content Management",
    to: APP_ROUTE_PATHS.adminContentLandingPage,
    showChevron: true,
    children: [
      {
        label: "Landing Page",
        to: APP_ROUTE_PATHS.adminContentLandingPage,
        allowedRoles: CONTENT_ADMIN_ROLES,
      },
      {
        label: "Settings",
        to: APP_ROUTE_PATHS.adminSettings,
        allowedRoles: SUPER_ADMIN_ROLES,
      },
    ],
  },
];

export const ADMIN_LOGOUT_ITEM: AdminSidebarItem = {
  label: "Logout",
  to: APP_ROUTE_PATHS.login,
  icon: LogOut,
  tone: "danger",
};
