import { Outlet } from 'react-router-dom'
import { OrgSidebar } from './OrgSidebar'
import { SiteHeader } from './SiteHeader'

export function OrgLayout() {
  return (
    <div className="portal-shell">
      <OrgSidebar />
      <div className="portal-shell__content">
        <SiteHeader section="org" />
        <main className="portal-shell__body">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
