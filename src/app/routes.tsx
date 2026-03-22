import { createBrowserRouter, type RouteObject } from 'react-router-dom'
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
import { InternalTenantsPage } from '../pages/internal/InternalTenantsPage'
import { ManagementEntryPage } from '../pages/org/ManagementEntryPage'
import { OrgLoginPage } from '../pages/org/OrgLoginPage'
import { SubmissionDetailPage } from '../pages/org/SubmissionDetailPage'
import { SubmissionsPage } from '../pages/org/SubmissionsPage'
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
        path: 'management',
        element: <ManagementEntryPage />,
      },
      {
        path: 'org/login',
        element: <OrgLoginPage />,
      },
      {
        path: 'internal',
        element: (
          <RoleProtectedRoute
            allowedRoles={['internal_admin', 'platform_admin']}
          />
        ),
        children: [
          {
            path: 'tenants',
            element: <InternalTenantsPage />,
          },
        ],
      },
      {
        path: 'org',
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
            path: 'courses/:courseId/form',
            element: <FormDesignerPage />,
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
