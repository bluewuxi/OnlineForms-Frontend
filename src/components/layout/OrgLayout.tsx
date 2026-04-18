import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { TenantThemeProvider } from '../../features/theming/TenantThemeProvider'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { getBranding } from '../../lib/api'
import { OrgSidebar } from './OrgSidebar'
import { SiteHeader } from './SiteHeader'

export function OrgLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { session } = useOrgSession()

  const brandingQuery = useQuery({
    queryKey: ['org-branding', session?.tenantId],
    enabled: Boolean(session?.tenantId),
    queryFn: async () => {
      const response = await getBranding(session!)
      return response.data
    },
  })

  return (
    <TenantThemeProvider theme={brandingQuery.data?.theme}>
      <div className="portal-shell">
        <div
          className={sidebarOpen ? 'portal-sidebar-overlay portal-sidebar-overlay--visible' : 'portal-sidebar-overlay'}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        <OrgSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="portal-shell__content">
          <SiteHeader
            section="org"
            onMenuToggle={() => setSidebarOpen((o) => !o)}
          />
          <main className="portal-shell__body">
            <Outlet />
          </main>
        </div>
      </div>
    </TenantThemeProvider>
  )
}
