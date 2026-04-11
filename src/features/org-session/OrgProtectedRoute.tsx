import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isSessionUsable } from './storage'
import { useOrgSession } from './useOrgSession'

const KNOWN_SESSION_ROLES = new Set([
  'org_viewer', 'org_editor', 'org_admin', 'internal_admin', 'platform_support',
])

export function OrgProtectedRoute() {
  const location = useLocation()
  const { session } = useOrgSession()

  const returnTo = `${location.pathname}${location.search}`

  if (!isSessionUsable(session)) {
    return (
      <Navigate
        replace
        to={`/org/login?returnTo=${encodeURIComponent(returnTo)}`}
      />
    )
  }

  // Users with no role or an unrecognised role must go through context selection.
  if (!session.role || !KNOWN_SESSION_ROLES.has(session.role)) {
    return (
      <Navigate
        replace
        to={`/org/login?returnTo=${encodeURIComponent(returnTo)}`}
      />
    )
  }

  const requiresTenantContext =
    session.role === 'org_admin' || session.role === 'org_editor' || session.role === 'org_viewer'
  if (requiresTenantContext && (!session.tenantId || session.tenantId.trim().length === 0)) {
    return (
      <Navigate
        replace
        to={`/org/login?returnTo=${encodeURIComponent(returnTo)}`}
      />
    )
  }

  return <Outlet />
}
