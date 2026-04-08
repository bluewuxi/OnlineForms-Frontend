import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isSessionUsable } from '../../features/org-session/storage'
import {
  isCognitoAuthEnabled,
  startCognitoLogin,
} from '../../features/org-session/cognito'
import { useOrgSession } from '../../features/org-session/useOrgSession'

function hasInternalCapability(role: string) {
  return role === 'internal_admin' || role === 'platform_support'
}

function hasOrgTenantCapability(role: string, tenantId?: string) {
  return (
    (role === 'org_admin' || role === 'org_editor' || role === 'org_viewer') &&
    Boolean(tenantId && tenantId.trim().length > 0)
  )
}

export function ManagementEntryPage() {
  const navigate = useNavigate()
  const { session } = useOrgSession()
  const [redirectError, setRedirectError] = useState<string | null>(null)
  const redirectStartedRef = useRef(false)
  const isCognitoMode = isCognitoAuthEnabled()

  useEffect(() => {
    if (redirectStartedRef.current) {
      return
    }
    redirectStartedRef.current = true

    if (!isCognitoMode) {
      navigate('/org/login', { replace: true })
      return
    }

    if (!isSessionUsable(session)) {
      startCognitoLogin('/org/login').catch((error: unknown) => {
        setRedirectError(
          error instanceof Error
            ? error.message
            : 'Failed to redirect to Cognito Hosted UI.',
        )
        redirectStartedRef.current = false
      })
      return
    }

    if (hasInternalCapability(session.role)) {
      navigate('/internal/tenants', { replace: true })
      return
    }

    if (hasOrgTenantCapability(session.role, session.tenantId)) {
      navigate('/org/submissions', { replace: true })
      return
    }

    navigate('/org/login', { replace: true })
  }, [isCognitoMode, navigate, session])

  return (
    <section className="content-panel content-panel--narrow">
      <p className="section-heading__eyebrow">Management</p>
      <h1>Redirecting to management</h1>
      <p>Preparing authentication and access context.</p>
      {redirectError ? (
        <>
          <p className="session-form__error">{redirectError}</p>
          <p>
            <Link to="/org/login">Open management login</Link>
          </p>
        </>
      ) : null}
    </section>
  )
}
