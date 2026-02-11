import { Navigate, createBrowserRouter } from "react-router-dom";

import { AdminLayout } from "@/layouts/admin-layout";
import { AdminCreateAdminPage } from "@/pages/admin/create-admin-page";
import { AdminDashboardPage } from "@/pages/admin/dashboard-page";
import { AdminFeedbackPage } from "@/pages/admin/feedback-page";
import { AdminInsightsIncidentTrendsPage } from "@/pages/admin/insights-incident-trends-page";
import { AdminInsightsPatternsPage } from "@/pages/admin/insights-patterns-page";
import { AdminInsightsPage } from "@/pages/admin/insights-page";
import { AdminSettingsPage } from "@/pages/admin/settings-page";
import { AdminUsersPage } from "@/pages/admin/users-page";
import { AuthLayout } from "@/layouts/auth-layout";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { VerifyOtpPage } from "@/pages/verify-otp-page";
import { APP_ROUTE_PATHS, APP_ROUTE_SEGMENTS } from "@/routes/paths";

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
        path: APP_ROUTE_SEGMENTS.users,
        element: <AdminUsersPage />,
      },
      {
        path: APP_ROUTE_SEGMENTS.insights,
        element: <AdminInsightsPage />,
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
        path: APP_ROUTE_SEGMENTS.settings,
        element: <AdminSettingsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
