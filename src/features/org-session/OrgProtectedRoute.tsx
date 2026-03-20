import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isSessionUsable } from './storage'
import { useOrgSession } from './useOrgSession'

export function OrgProtectedRoute() {
  const location = useLocation()
  const { session } = useOrgSession()

  if (!isSessionUsable(session)) {
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
