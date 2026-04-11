import { Outlet, useLocation } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { PublicFooter } from './PublicFooter'
import { SiteHeader } from './SiteHeader'

export function RootLayout() {
  const location = useLocation()
  const isLoginRoute = location.pathname === '/org/login'
  const isAcceptInviteRoute = location.pathname === '/org/accept-invite'
  const isInternalRoute =
    location.pathname === '/internal' || location.pathname.startsWith('/internal/')
  const isOrgRoute =
    location.pathname.startsWith('/org') && !isLoginRoute && !isAcceptInviteRoute

  // Org and internal routes have their own layout components with sidebar + header.
  // RootLayout only provides the shell for public, login, and accept-invite routes.
  if (isOrgRoute || isInternalRoute) {
    return <Outlet />
  }

  const section = isLoginRoute || isAcceptInviteRoute ? 'login' : 'public'

  return (
    <AppLayout
      section={section}
      header={<SiteHeader section={section} />}
      notificationSlot={<div aria-live="polite" className="app-notification-slot" />}
      footer={section === 'public' ? <PublicFooter /> : null}
    >
      <Outlet />
    </AppLayout>
  )
}
