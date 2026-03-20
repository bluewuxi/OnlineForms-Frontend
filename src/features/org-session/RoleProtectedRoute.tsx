import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useOrgSession } from './useOrgSession'

type RoleProtectedRouteProps = {
  allowedRoles: string[]
}

export function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
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

  if (!allowedRoles.includes(session.role)) {
    return (
      <section className="content-panel content-panel--narrow">
        <p className="section-heading__eyebrow">Access denied</p>
        <h1>You are not authorised to view this page</h1>
        <p>
          The current role does not include access to the internal management
          area.
        </p>
      </section>
    )
  }

  return <Outlet />
}
