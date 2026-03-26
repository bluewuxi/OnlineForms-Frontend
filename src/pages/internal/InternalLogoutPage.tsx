import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logInternalAccessUserLogout } from '../../lib/api'
import { useOrgSession } from '../../features/org-session/useOrgSession'

export function InternalLogoutPage() {
  const navigate = useNavigate()
  const { session, signOut } = useOrgSession()

  useEffect(() => {
    let cancelled = false

    async function completeLogout() {
      try {
        if (session?.accessToken && (session.role === 'internal_admin' || session.role === 'platform_admin')) {
          await logInternalAccessUserLogout(session)
        }
      } catch {
        // Best-effort audit logging should not block logout.
      } finally {
        if (!cancelled) {
          signOut()
          navigate('/', { replace: true })
        }
      }
    }

    void completeLogout()

    return () => {
      cancelled = true
    }
  }, [navigate, session, signOut])

  return null
}
