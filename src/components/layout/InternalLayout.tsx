import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { InternalSidebar } from './InternalSidebar'
import { SiteHeader } from './SiteHeader'

export function InternalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="portal-shell">
      <div
        className={sidebarOpen ? 'portal-sidebar-overlay portal-sidebar-overlay--visible' : 'portal-sidebar-overlay'}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <InternalSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="portal-shell__content">
        <SiteHeader
          section="internal"
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
        <main className="portal-shell__body">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
