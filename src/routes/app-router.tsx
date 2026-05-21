import { AdminAboutPanel } from "@/components/admin/admin-about-panel";
import { ADMIN_OPERATIONS_CONFIGS } from "@/components/admin/admin-operations-config";
import { AdminOperationsSectionPage } from "@/components/admin/admin-operations-section-page";
import { RequireAdminAuth } from "@/components/auth/require-admin-auth";
import { AdminLayout } from "@/layouts/admin-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import {
  ANALYTICS_ADMIN_ROLES,
  CONTENT_ADMIN_ROLES,
  INTEGRATION_ADMIN_ROLES,
  SUPER_ADMIN_ROLES,
} from "@/lib/admin-rbac";
import { AdminAiEngineControlPage } from "@/pages/admin/ai-engine-control-page";
import { AdminChangePasswordPage } from "@/pages/admin/change-password-page";
import { AdminContentKnowledgeSourcesRoutePage } from "@/pages/admin/content-knowledge-sources-page";
import { AdminContentEducationalContentRoutePage } from "@/pages/admin/content-educational-content-page";
import { AdminContentLandingRoutePage } from "@/pages/admin/content-landing-page";
import { AdminContentManagementPage } from "@/pages/admin/content-management-page";
import { AdminContentMediaAssetRoutePage } from "@/pages/admin/content-media-asset-page";
import { AdminContentResourceLibraryRoutePage } from "@/pages/admin/content-resource-library-page";
import { AdminContentUploadResourceRoutePage } from "@/pages/admin/content-upload-resource-page";
import { AdminCreateAdminPage } from "@/pages/admin/create-admin-page";
import { AdminCulturalProfilesPage } from "@/pages/admin/cultural-profiles-page";
import { AdminDataProtectionPage } from "@/pages/admin/data-protection-page";
import { AdminDashboardPage } from "@/pages/admin/dashboard-page";
import { AdminEarningsPage } from "@/pages/admin/earnings-page";
import { AdminFeedbackPage } from "@/pages/admin/feedback-page";
import { AdminInsightsIncidentTrendsPage } from "@/pages/admin/insights-incident-trends-page";
import { AdminInsightsPatternsPage } from "@/pages/admin/insights-patterns-page";
import { AdminIntelligenceCenterPage } from "@/pages/admin/intelligence-center-page";
import { AdminLanguagePacksPage } from "@/pages/admin/language-packs-page";
import { AdminNotificationsPage } from "@/pages/admin/notifications-page";
import { AdminPlatformSettingsPage } from "@/pages/admin/platform-settings-page";
import { AdminPrivacyPolicyPage } from "@/pages/admin/privacy-policy-page";
import { AdminProfilePage } from "@/pages/admin/profile-page";
import { AdminSettingsPage } from "@/pages/admin/settings-page";
import { AdminSubscriptionsPage } from "@/pages/admin/subscriptions-page";
import { AdminSupportServicesPage } from "@/pages/admin/support-services-page";
import { AdminTermsConditionsPage } from "@/pages/admin/terms-conditions-page";
import { AdminUsersPage } from "@/pages/admin/users-page";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { VerifyOtpPage } from "@/pages/verify-otp-page";
import { APP_ROUTE_PATHS, APP_ROUTE_SEGMENTS } from "@/routes/paths";
import type { ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

const superOnly = (element: ReactNode) => (
  <RequireAdminAuth allowedRoles={SUPER_ADMIN_ROLES}>{element}</RequireAdminAuth>
);

const contentOnly = (element: ReactNode) => (
  <RequireAdminAuth allowedRoles={CONTENT_ADMIN_ROLES}>{element}</RequireAdminAuth>
);

const integrationOnly = (element: ReactNode) => (
  <RequireAdminAuth allowedRoles={INTEGRATION_ADMIN_ROLES}>{element}</RequireAdminAuth>
);

const analyticsOnly = (element: ReactNode) => (
  <RequireAdminAuth allowedRoles={ANALYTICS_ADMIN_ROLES}>{element}</RequireAdminAuth>
);

export const appRouter = createBrowserRouter([
  {
    path: APP_ROUTE_PATHS.root,
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={APP_ROUTE_SEGMENTS.login} replace />,
      },
      {
        path: APP_ROUTE_SEGMENTS.login,
        element: <LoginPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.forgotPassword,
        element: <ForgotPasswordPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.verifyOtp,
        element: <VerifyOtpPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.resetPassword,
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    path: APP_ROUTE_SEGMENTS.admin,
    element: (
      <RequireAdminAuth>
        <AdminLayout />
      </RequireAdminAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={APP_ROUTE_SEGMENTS.dashboard} replace />,
      },
      {
        path: APP_ROUTE_SEGMENTS.dashboard,
        element: <AdminDashboardPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.profile,
        element: <AdminProfilePage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.users,
        element: superOnly(<AdminUsersPage />),
      },
      {
        path: APP_ROUTE_SEGMENTS.auditLogs,
        element: superOnly(
          <AdminOperationsSectionPage
            config={ADMIN_OPERATIONS_CONFIGS.auditLogs}
            sectionKey="auditLogs"
          />
        ),
      },
      {
        path: APP_ROUTE_SEGMENTS.securityCompliance,
        element: superOnly(
          <Navigate
            to={APP_ROUTE_PATHS.adminIdentityAccessManagement}
            replace
          />
        ),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.securityCompliance}/${APP_ROUTE_SEGMENTS.identityAccessManagement}`,
        element: superOnly(
          <AdminOperationsSectionPage
            config={ADMIN_OPERATIONS_CONFIGS.identityAccessManagement}
          />
        ),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.securityCompliance}/${APP_ROUTE_SEGMENTS.securityMonitoring}`,
        element: superOnly(<Navigate to={APP_ROUTE_PATHS.adminPlatformHealth} replace />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.securityCompliance}/${APP_ROUTE_SEGMENTS.dataProtection}`,
        element: superOnly(<AdminDataProtectionPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.securityCompliance}/${APP_ROUTE_SEGMENTS.privacyControls}`,
        element: superOnly(
          <AdminOperationsSectionPage
            config={ADMIN_OPERATIONS_CONFIGS.privacyControls}
            sectionKey="privacyRequests"
          />
        ),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.securityCompliance}/${APP_ROUTE_SEGMENTS.legalCompliance}`,
        element: superOnly(
          <AdminOperationsSectionPage
            config={ADMIN_OPERATIONS_CONFIGS.legalCompliance}
          />
        ),
      },
      {
        path: APP_ROUTE_SEGMENTS.platformIntelligence,
        element: contentOnly(
          <Navigate to={APP_ROUTE_PATHS.adminTaxonomiesManagement} replace />
        ),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.taxonomiesManagement}`,
        element: contentOnly(
          <AdminOperationsSectionPage
            config={ADMIN_OPERATIONS_CONFIGS.taxonomiesManagement}
            sectionKey="taxonomies"
          />
        ),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.serviceDestinations}`,
        element: integrationOnly(
          <AdminOperationsSectionPage
            config={ADMIN_OPERATIONS_CONFIGS.serviceDestinations}
            sectionKey="destinations"
          />
        ),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.integrationManagement}`,
        element: integrationOnly(
          <AdminOperationsSectionPage
            config={ADMIN_OPERATIONS_CONFIGS.integrationManagement}
            sectionKey="deliveries"
          />
        ),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.aiEngineControl}`,
        element: contentOnly(<AdminAiEngineControlPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.culturalProfiles}`,
        element: contentOnly(<AdminCulturalProfilesPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.languagePacks}`,
        element: contentOnly(<AdminLanguagePacksPage />),
      },
      {
        path: APP_ROUTE_SEGMENTS.crisisSafety,
        element: integrationOnly(
          <Navigate to={APP_ROUTE_PATHS.adminCrisisResponseCenter} replace />
        ),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.crisisSafety}/${APP_ROUTE_SEGMENTS.crisisResponseCenter}`,
        element: superOnly(
          <AdminOperationsSectionPage
            config={ADMIN_OPERATIONS_CONFIGS.crisisResponseCenter}
          />
        ),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.crisisSafety}/${APP_ROUTE_SEGMENTS.supportServices}`,
        element: integrationOnly(<AdminSupportServicesPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.crisisSafety}/${APP_ROUTE_SEGMENTS.contentModeration}`,
        element: contentOnly(
          <AdminOperationsSectionPage
            config={ADMIN_OPERATIONS_CONFIGS.contentModeration}
          />
        ),
      },
      {
        path: APP_ROUTE_SEGMENTS.contentManagement,
        element: contentOnly(
          <Navigate
            to={APP_ROUTE_PATHS.adminContentEducationalContent}
            replace
          />
        ),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentLandingPage}`,
        element: contentOnly(<AdminContentLandingRoutePage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentMediaAsset}`,
        element: contentOnly(<AdminContentMediaAssetRoutePage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentKnowledgeSources}`,
        element: contentOnly(<AdminContentKnowledgeSourcesRoutePage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentResourceLibrary}`,
        element: contentOnly(<AdminContentResourceLibraryRoutePage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentUploadResource}`,
        element: contentOnly(<AdminContentUploadResourceRoutePage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentEducationalContent}`,
        element: contentOnly(<AdminContentEducationalContentRoutePage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.microEducationCards}`,
        element: contentOnly(<AdminContentManagementPage />),
      },
      {
        path: APP_ROUTE_SEGMENTS.insights,
        element: analyticsOnly(
          <Navigate to={APP_ROUTE_PATHS.adminIncidentInsights} replace />
        ),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.incidentInsights}`,
        element: analyticsOnly(<AdminIntelligenceCenterPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.heatmaps}`,
        element: analyticsOnly(<AdminIntelligenceCenterPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.trends}`,
        element: analyticsOnly(<AdminIntelligenceCenterPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.incidentTrends}`,
        element: analyticsOnly(<AdminInsightsIncidentTrendsPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.intelligenceCenter}`,
        element: analyticsOnly(<AdminIntelligenceCenterPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.patterns}`,
        element: analyticsOnly(<AdminInsightsPatternsPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.platformHealth}`,
        element: analyticsOnly(
          <AdminOperationsSectionPage
            config={ADMIN_OPERATIONS_CONFIGS.platformHealth}
          />
        ),
      },
      {
        path: APP_ROUTE_SEGMENTS.createAdmin,
        element: superOnly(<AdminCreateAdminPage />),
      },
      {
        path: APP_ROUTE_SEGMENTS.feedback,
        element: superOnly(<AdminFeedbackPage />),
      },
      {
        path: APP_ROUTE_SEGMENTS.earnings,
        element: superOnly(<AdminEarningsPage />),
      },
      {
        path: APP_ROUTE_SEGMENTS.subscriptions,
        element: superOnly(<AdminSubscriptionsPage />),
      },
      {
        path: APP_ROUTE_SEGMENTS.notifications,
        element: superOnly(<AdminNotificationsPage />),
      },
      {
        path: APP_ROUTE_SEGMENTS.settings,
        element: superOnly(<AdminSettingsPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.settings}/${APP_ROUTE_SEGMENTS.platformSettings}`,
        element: contentOnly(<AdminPlatformSettingsPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.settings}/${APP_ROUTE_SEGMENTS.changePassword}`,
        element: <AdminChangePasswordPage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.settings}/${APP_ROUTE_SEGMENTS.privacyPolicy}`,
        element: contentOnly(<AdminPrivacyPolicyPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.settings}/${APP_ROUTE_SEGMENTS.termsConditions}`,
        element: contentOnly(<AdminTermsConditionsPage />),
      },
      {
        path: `${APP_ROUTE_SEGMENTS.settings}/${APP_ROUTE_SEGMENTS.aboutUs}`,
        element: contentOnly(<AdminAboutPanel />),
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
