import { Outlet, useParams } from 'react-router-dom'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { isValidTenantCode } from '../../lib/routing/tenantCode'

export function TenantRouteGuard() {
  const { tenantCode } = useParams()

  if (!tenantCode || !isValidTenantCode(tenantCode)) {
    return <NotFoundPage />
  }

  return <Outlet />
}
