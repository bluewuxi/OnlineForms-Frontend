import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { InternalLayout } from '../components/layout/InternalLayout'
import { OrgLayout } from '../components/layout/OrgLayout'
import { RootLayout } from '../components/layout/RootLayout'
import { LegacyTenantRedirect } from '../components/routing/LegacyTenantRedirect'
import { TenantRouteGuard } from '../components/routing/TenantRouteGuard'
import { OrgProtectedRoute } from '../features/org-session/OrgProtectedRoute'
import { RoleProtectedRoute } from '../features/org-session/RoleProtectedRoute'
import { AuditPage } from '../pages/org/AuditPage'
import { BrandingPage } from '../pages/org/BrandingPage'
import { CourseEditorPage } from '../pages/org/CourseEditorPage'
import { CoursesPage } from '../pages/org/CoursesPage'
import { FormDesignerPage } from '../pages/org/FormDesignerPage'
import { FormTemplatesPage } from '../pages/org/FormTemplatesPage'
import { FormTemplateEditorPage } from '../pages/org/FormTemplateEditorPage'
import { OrgSettingsPage } from '../pages/org/OrgSettingsPage'
import { PaymentSettingsPage } from '../pages/org/PaymentSettingsPage'
import { AcceptInvitePage } from '../pages/org/AcceptInvitePage'
import { TeamPage } from '../pages/org/TeamPage'
import { InternalHomePage } from '../pages/internal/InternalHomePage'
import { InternalLogoutPage } from '../pages/internal/InternalLogoutPage'
import { InternalTenantsPage } from '../pages/internal/InternalTenantsPage'
import { InternalUsersPage } from '../pages/internal/InternalUsersPage'
import { ManagementEntryPage } from '../pages/org/ManagementEntryPage'
import { OrgLoginPage } from '../pages/org/OrgLoginPage'
import { SubmissionDetailPage } from '../pages/org/SubmissionDetailPage'
import { SubmissionsPage } from '../pages/org/SubmissionsPage'
import { AboutUsPage } from '../pages/public/AboutUsPage'
import { ContactPage } from '../pages/public/ContactPage'
import { CourseCatalogPage } from '../pages/public/CourseCatalogPage'
import { CourseDetailPage } from '../pages/public/CourseDetailPage'
import { TenantHomePage } from '../pages/public/TenantHomePage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RouteErrorPage } from '../pages/RouteErrorPage'

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 't/:tenantCode/courses',
        element: <LegacyTenantRedirect />,
      },
      {
        path: 't/:tenantCode/courses/:courseId',
        element: <LegacyTenantRedirect includeCourseId />,
      },
      {
        path: ':tenantCode',
        element: <TenantRouteGuard />,
        children: [
          {
            index: true,
            element: <TenantHomePage />,
          },
          {
            path: 'courses',
            element: <CourseCatalogPage />,
          },
          {
            path: 'courses/:courseId',
            element: <CourseDetailPage />,
          },
        ],
      },
      {
        path: 'about',
        element: <AboutUsPage />,
      },
      {
        path: 'contact',
        element: <ContactPage />,
      },
      {
        path: 'management',
        element: <ManagementEntryPage />,
      },
      {
        path: 'org/login',
        element: <OrgLoginPage />,
      },
      {
        path: 'org/accept-invite',
        element: <AcceptInvitePage />,
      },
      {
        path: 'internal/logout',
        element: <InternalLogoutPage />,
      },
      {
        path: 'internal',
        element: <InternalLayout />,
        children: [
          {
            element: (
              <RoleProtectedRoute
                allowedRoles={['internal_admin', 'platform_support']}
              />
            ),
            children: [
              {
                index: true,
                element: <InternalHomePage />,
              },
              {
                path: 'tenants',
                element: <InternalTenantsPage />,
              },
              {
                path: 'users',
                element: <InternalUsersPage />,
              },
            ],
          },
        ],
      },
      {
        path: 'org',
        element: <OrgLayout />,
        children: [
          {
            element: <OrgProtectedRoute />,
            children: [
              {
                path: 'courses',
                element: <CoursesPage />,
              },
              {
                path: 'courses/new',
                element: <CourseEditorPage />,
              },
              {
                path: 'courses/:courseId',
                element: <CourseEditorPage />,
              },
              {
                path: 'submissions',
                element: <SubmissionsPage />,
              },
              {
                path: 'settings',
                element: <OrgSettingsPage />,
              },
              {
                path: 'submissions/:submissionId',
                element: <SubmissionDetailPage />,
              },
              {
                path: 'audit',
                element: <AuditPage />,
              },
              {
                path: 'branding',
                element: <BrandingPage />,
              },
              {
                path: 'payment-settings',
                element: <PaymentSettingsPage />,
              },
              {
                path: 'courses/:courseId/form',
                element: <FormDesignerPage />,
              },
              {
                path: 'team',
                element: <TeamPage />,
              },
              {
                path: 'form-templates',
                element: <FormTemplatesPage />,
              },
              {
                path: 'form-templates/:templateId',
                element: <FormTemplateEditorPage />,
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(appRoutes)
}
