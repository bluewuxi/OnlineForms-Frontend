import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useOrgSession } from './useOrgSession'

export function OrgProtectedRoute() {
  const location = useLocation()
  const { session } = useOrgSession()

  if (!session) {
    const returnTo = `${location.pathname}${location.search}`
    return (
      <Navigate
        replace
        to={`/org/login?returnTo=${encodeURIComponent(returnTo)}`}
      />
    )
  }

  return <Outlet />
}
