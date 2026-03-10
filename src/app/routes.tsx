import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { RootLayout } from '../components/layout/RootLayout'
import { AuditPage } from '../pages/org/AuditPage'
import { BrandingPage } from '../pages/org/BrandingPage'
import { OrgLoginPage } from '../pages/org/OrgLoginPage'
import { SubmissionDetailPage } from '../pages/org/SubmissionDetailPage'
import { SubmissionsPage } from '../pages/org/SubmissionsPage'
import { CourseCatalogPage } from '../pages/public/CourseCatalogPage'
import { CourseDetailPage } from '../pages/public/CourseDetailPage'
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
        element: <CourseCatalogPage />,
      },
      {
        path: 't/:tenantCode/courses/:courseId',
        element: <CourseDetailPage />,
      },
      {
        path: 'org/login',
        element: <OrgLoginPage />,
      },
      {
        path: 'org/submissions',
        element: <SubmissionsPage />,
      },
      {
        path: 'org/submissions/:submissionId',
        element: <SubmissionDetailPage />,
      },
      {
        path: 'org/audit',
        element: <AuditPage />,
      },
      {
        path: 'org/branding',
        element: <BrandingPage />,
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
