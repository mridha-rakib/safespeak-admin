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
        path: APP_ROUTE_SEGMENTS.contentManagement,
        element: <Navigate to={APP_ROUTE_PATHS.adminContentLandingPage} replace />,
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
        path: `${APP_ROUTE_SEGMENTS.insights}/${APP_ROUTE_SEGMENTS.patterns}`,
        element: <AdminInsightsPatternsPage />,
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
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
