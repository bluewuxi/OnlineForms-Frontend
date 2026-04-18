import { useQuery } from '@tanstack/react-query'
import { Outlet, useParams } from 'react-router-dom'
import { TenantThemeProvider } from '../../features/theming/TenantThemeProvider'
import { getPublicTenantHome } from '../../lib/api'
import { isValidTenantCode } from '../../lib/routing/tenantCode'
import { NotFoundPage } from '../../pages/NotFoundPage'

export function TenantRouteGuard() {
  const { tenantCode } = useParams()

  const tenantQuery = useQuery({
    queryKey: ['tenant-home', tenantCode],
    queryFn: async () => {
      const response = await getPublicTenantHome(tenantCode!)
      return response.data
    },
    enabled: Boolean(tenantCode) && isValidTenantCode(tenantCode ?? ''),
  })

  if (!tenantCode || !isValidTenantCode(tenantCode)) {
    return <NotFoundPage />
  }

  return (
    <TenantThemeProvider theme={tenantQuery.data?.branding?.theme}>
      <Outlet />
    </TenantThemeProvider>
  )
}
