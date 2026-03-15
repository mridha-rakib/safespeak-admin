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
    label: "Security & Compliance Center",
    to: APP_ROUTE_PATHS.adminSecurityCompliance,
    showChevron: true,
    children: [
      {
        label: "Identity & Access Management",
        to: APP_ROUTE_PATHS.adminIdentityAccessManagement,
      },
      {
        label: "Security Monitoring",
        to: APP_ROUTE_PATHS.adminSecurityMonitoring,
      },
      {
        label: "Data Protection",
        to: APP_ROUTE_PATHS.adminDataProtection,
      },
      {
        label: "Privacy Controls",
        to: APP_ROUTE_PATHS.adminPrivacyControls,
      },
      {
        label: "Legal Compliance",
        to: APP_ROUTE_PATHS.adminLegalCompliance,
      },
    ],
  },
  {
    label: "Platform Intelligence Engine",
    to: APP_ROUTE_PATHS.adminPlatformIntelligence,
    showChevron: true,
    children: [
      {
        label: "Taxonomies Management",
        to: APP_ROUTE_PATHS.adminTaxonomiesManagement,
      },
      {
        label: "Service Destinations",
        to: APP_ROUTE_PATHS.adminServiceDestinations,
      },
      {
        label: "Integration Management",
        to: APP_ROUTE_PATHS.adminIntegrationManagement,
      },
      {
        label: "AI Engine Control",
        to: APP_ROUTE_PATHS.adminAiEngineControl,
      },
      {
        label: "Cultural Profiles",
        to: APP_ROUTE_PATHS.adminCulturalProfiles,
      },
      {
        label: "Language Packs",
        to: APP_ROUTE_PATHS.adminLanguagePacks,
      },
    ],
  },
  {
    label: "Analytics & Intelligence Center",
    to: APP_ROUTE_PATHS.adminInsights,
    showChevron: true,
    children: [
      {
        label: "Incident Insights & Trends",
        to: APP_ROUTE_PATHS.adminInsightsIncidentTrends,
      },
      {
        label: "Intelligence Center",
        to: APP_ROUTE_PATHS.adminIntelligenceCenter,
      },
      {
        label: "Patterns",
        to: APP_ROUTE_PATHS.adminInsightsPatterns,
      },
      {
        label: "Platform Health",
        to: APP_ROUTE_PATHS.adminPlatformHealth,
      },
    ],
  },
  {
    label: "Crisis & Safety Management",
    to: APP_ROUTE_PATHS.adminCrisisSafety,
    showChevron: true,
    children: [
      {
        label: "Crisis Response Center",
        to: APP_ROUTE_PATHS.adminCrisisResponseCenter,
      },
      {
        label: "Content Moderation",
        to: APP_ROUTE_PATHS.adminContentModeration,
      },
    ],
  },
  {
    label: "Content & Education Management",
    to: APP_ROUTE_PATHS.adminContentManagement,
    showChevron: true,
    children: [
      {
        label: "Educational Content",
        to: APP_ROUTE_PATHS.adminContentEducationalContent,
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
        label: "Micro-Education Cards",
        to: APP_ROUTE_PATHS.adminContentMicroEducationCards,
      },
      {
        label: "Media Asset",
        to: APP_ROUTE_PATHS.adminContentMediaAsset,
      },
    ],
  },
  {
    label: "User & Operations Management",
    to: APP_ROUTE_PATHS.adminUsers,
    showChevron: true,
    children: [
      {
        label: "Users",
        to: APP_ROUTE_PATHS.adminUsers,
      },
      {
        label: "Feedback",
        to: APP_ROUTE_PATHS.adminFeedback,
      },
      {
        label: "Create Admin",
        to: APP_ROUTE_PATHS.adminCreateAdmin,
      },
      {
        label: "Audit Logs",
        to: APP_ROUTE_PATHS.adminAuditLogs,
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
      },
      {
        label: "Settings",
        to: APP_ROUTE_PATHS.adminSettings,
      },
      {
        label: "Earnings",
        to: APP_ROUTE_PATHS.adminEarnings,
      },
      {
        label: "Subscriptions",
        to: APP_ROUTE_PATHS.adminSubscriptions,
      },
    ],
  },
];

export const ADMIN_LOGOUT_ITEM: AdminSidebarItem = {
  label: "Logout",
  to: APP_ROUTE_PATHS.login,
  tone: "danger",
};
