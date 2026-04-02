import { Outlet } from 'react-router-dom'
import { InternalSidebar } from './InternalSidebar'
import { SiteHeader } from './SiteHeader'

export function InternalLayout() {
  return (
    <div className="portal-shell">
      <InternalSidebar />
      <div className="portal-shell__content">
        <SiteHeader section="internal" />
        <main className="portal-shell__body">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
