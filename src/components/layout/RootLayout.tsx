import { Outlet, useLocation } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { SiteHeader } from './SiteHeader'

export function RootLayout() {
  const location = useLocation()
  const isOrgRoute = location.pathname.startsWith('/org')

  return (
    <AppLayout
      header={<SiteHeader section={isOrgRoute ? 'org' : 'public'} />}
      notificationSlot={<div aria-live="polite" className="app-notification-slot" />}
    >
      <Outlet />
    </AppLayout>
  )
}
