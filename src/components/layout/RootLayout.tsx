import { Outlet, useLocation } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { SiteHeader } from './SiteHeader'

export function RootLayout() {
  const location = useLocation()
  const isLoginRoute = location.pathname === '/org/login'
  const isInternalRoute =
    location.pathname === '/internal' || location.pathname.startsWith('/internal/')
  const isOrgRoute = location.pathname.startsWith('/org') && !isLoginRoute
  const section = isLoginRoute ? 'login' : isInternalRoute ? 'internal' : isOrgRoute ? 'org' : 'public'

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
