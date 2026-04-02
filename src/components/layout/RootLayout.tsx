import { Outlet, useLocation } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { SiteHeader } from './SiteHeader'

export function RootLayout() {
  const location = useLocation()
  const isLoginRoute = location.pathname === '/org/login'
  const isInternalRoute =
    location.pathname === '/internal' || location.pathname.startsWith('/internal/')
  const isOrgRoute = location.pathname.startsWith('/org') && !isLoginRoute

  // Org and internal routes have their own layout components with sidebar + header.
  // RootLayout only provides the shell for public and login routes.
  if (isOrgRoute || isInternalRoute) {
    return <Outlet />
  }

  const section = isLoginRoute ? 'login' : 'public'

  return (
    <AppLayout
      section={section}
      header={<SiteHeader section={section} />}
      notificationSlot={<div aria-live="polite" className="app-notification-slot" />}
    >
      <Outlet />
    </AppLayout>
  )
}
