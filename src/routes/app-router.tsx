import { AdminAboutPanel } from "@/components/admin/admin-about-panel";
import { ADMIN_OPERATIONS_CONFIGS } from "@/components/admin/admin-operations-config";
import { AdminOperationsSectionPage } from "@/components/admin/admin-operations-section-page";
import { AdminLayout } from "@/layouts/admin-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { AdminChangePasswordPage } from "@/pages/admin/change-password-page";
import { AdminContentKnowledgeSourcesRoutePage } from "@/pages/admin/content-knowledge-sources-page";
import { AdminContentLandingRoutePage } from "@/pages/admin/content-landing-page";
import { AdminContentManagementPage } from "@/pages/admin/content-management-page";
import { AdminContentMediaAssetRoutePage } from "@/pages/admin/content-media-asset-page";
import { AdminContentResourceLibraryRoutePage } from "@/pages/admin/content-resource-library-page";
import { AdminContentUploadResourceRoutePage } from "@/pages/admin/content-upload-resource-page";
import { AdminCreateAdminPage } from "@/pages/admin/create-admin-page";
import { AdminDashboardPage } from "@/pages/admin/dashboard-page";
import { AdminEarningsPage } from "@/pages/admin/earnings-page";
import { AdminFeedbackPage } from "@/pages/admin/feedback-page";
import { AdminInsightsIncidentTrendsPage } from "@/pages/admin/insights-incident-trends-page";
import { AdminInsightsPatternsPage } from "@/pages/admin/insights-patterns-page";
import { AdminNotificationsPage } from "@/pages/admin/notifications-page";
import { AdminPrivacyPolicyPage } from "@/pages/admin/privacy-policy-page";
import { AdminProfilePage } from "@/pages/admin/profile-page";
import { AdminSettingsPage } from "@/pages/admin/settings-page";
import { AdminSubscriptionsPage } from "@/pages/admin/subscriptions-page";
import { AdminTermsConditionsPage } from "@/pages/admin/terms-conditions-page";
import { AdminUsersPage } from "@/pages/admin/users-page";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { VerifyOtpPage } from "@/pages/verify-otp-page";
import { APP_ROUTE_PATHS, APP_ROUTE_SEGMENTS } from "@/routes/paths";
import { createBrowserRouter, Navigate } from "react-router-dom";

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
    element: <AdminLayout />,
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
        element: <AdminUsersPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.auditLogs,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.auditLogs} />,
      },
      {
        path: APP_ROUTE_SEGMENTS.securityCompliance,
        element: <Navigate to={APP_ROUTE_PATHS.adminIdentityAccessManagement} replace />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.securityCompliance}/${APP_ROUTE_SEGMENTS.identityAccessManagement}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.identityAccessManagement} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.securityCompliance}/${APP_ROUTE_SEGMENTS.securityMonitoring}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.securityMonitoring} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.securityCompliance}/${APP_ROUTE_SEGMENTS.dataProtection}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.dataProtection} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.securityCompliance}/${APP_ROUTE_SEGMENTS.privacyControls}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.privacyControls} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.securityCompliance}/${APP_ROUTE_SEGMENTS.legalCompliance}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.legalCompliance} />,
      },
      {
        path: APP_ROUTE_SEGMENTS.platformIntelligence,
        element: <Navigate to={APP_ROUTE_PATHS.adminTaxonomiesManagement} replace />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.taxonomiesManagement}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.taxonomiesManagement} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.serviceDestinations}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.serviceDestinations} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.integrationManagement}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.integrationManagement} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.aiEngineControl}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.aiEngineControl} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.culturalProfiles}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.culturalProfiles} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.platformIntelligence}/${APP_ROUTE_SEGMENTS.languagePacks}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.languagePacks} />,
      },
      {
        path: APP_ROUTE_SEGMENTS.crisisSafety,
        element: <Navigate to={APP_ROUTE_PATHS.adminCrisisResponseCenter} replace />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.crisisSafety}/${APP_ROUTE_SEGMENTS.crisisResponseCenter}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.crisisResponseCenter} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.crisisSafety}/${APP_ROUTE_SEGMENTS.contentModeration}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.contentModeration} />,
      },
      {
        path: APP_ROUTE_SEGMENTS.contentManagement,
        element: <Navigate to={APP_ROUTE_PATHS.adminContentEducationalContent} replace />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentLandingPage}`,
        element: <AdminContentLandingRoutePage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentMediaAsset}`,
        element: <AdminContentMediaAssetRoutePage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentKnowledgeSources}`,
        element: <AdminContentKnowledgeSourcesRoutePage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentResourceLibrary}`,
        element: <AdminContentResourceLibraryRoutePage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentUploadResource}`,
        element: <AdminContentUploadResourceRoutePage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.contentEducationalContent}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.educationalContent} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.contentManagement}/${APP_ROUTE_SEGMENTS.microEducationCards}`,
        element: <AdminContentManagementPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.insights,
        element: <Navigate to={APP_ROUTE_PATHS.adminInsightsIncidentTrends} replace />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.incidentTrends}`,
        element: <AdminInsightsIncidentTrendsPage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.intelligenceCenter}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.intelligenceCenter} />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.patterns}`,
        element: <AdminInsightsPatternsPage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.platformHealth}`,
        element: <AdminOperationsSectionPage config={ADMIN_OPERATIONS_CONFIGS.platformHealth} />,
      },
      {
        path: APP_ROUTE_SEGMENTS.createAdmin,
        element: <AdminCreateAdminPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.feedback,
        element: <AdminFeedbackPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.earnings,
        element: <AdminEarningsPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.subscriptions,
        element: <AdminSubscriptionsPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.notifications,
        element: <AdminNotificationsPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.settings,
        element: <AdminSettingsPage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.settings}/${APP_ROUTE_SEGMENTS.changePassword}`,
        element: <AdminChangePasswordPage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.settings}/${APP_ROUTE_SEGMENTS.privacyPolicy}`,
        element: <AdminPrivacyPolicyPage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.settings}/${APP_ROUTE_SEGMENTS.termsConditions}`,
        element: <AdminTermsConditionsPage />,
      },
      {
        path: `${APP_ROUTE_SEGMENTS.settings}/${APP_ROUTE_SEGMENTS.aboutUs}`,
        element: <AdminAboutPanel />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
