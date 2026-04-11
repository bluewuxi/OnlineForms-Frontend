import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHero } from '../../components/layout/PageHero'
import {
  isCognitoAuthEnabled,
  startCognitoLogin,
  startCognitoRelogin,
} from '../../features/org-session/cognito'
import { isSessionUsable } from '../../features/org-session/storage'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { ApiClientError, acceptOrgInvite, validateSessionContext } from '../../lib/api'

type PageState =
  | { status: 'idle' }
  | { status: 'accepting' }
  | { status: 'success'; role: string }
  | { status: 'error'; message: string; code?: string }

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: 'This invitation could not be found. It may have been cancelled.',
  CONFLICT: 'This invitation has already been accepted or has expired.',
  FORBIDDEN:
    'The email address on this invitation does not match your account. Make sure you are signed in with the correct account.',
}

function friendlyError(error: unknown): { message: string; code?: string } {
  if (error instanceof ApiClientError) {
    const message = ERROR_MESSAGES[error.code ?? ''] ?? error.message
    return { message, code: error.code ?? undefined }
  }
  if (error instanceof Error) {
    return { message: error.message }
  }
  return { message: 'An unexpected error occurred. Please try again.' }
}

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { session, signIn, signOut } = useOrgSession()

  const inviteId = searchParams.get('inviteId') ?? ''
  const tenantId = searchParams.get('tenantId') ?? ''

  const [pageState, setPageState] = useState<PageState>({ status: 'idle' })
  const [isStartingLogin, setIsStartingLogin] = useState(false)
  const acceptedRef = useRef(false)

  const isCognito = isCognitoAuthEnabled()
  const hasSession = isSessionUsable(session)
  // A usable session here may still lack tenantId — that is intentional.
  // The accept endpoint only requires a bearer token, not tenant membership.
  const hasToken = Boolean(session?.accessToken)

  const missingParams = !inviteId || !tenantId

  // In Cognito mode, if we have a session with a bearer token, accept automatically.
  // This fires once after the fast-track from OrgLoginPage delivers the session.
  useEffect(() => {
    if (!isCognito) return
    if (!hasToken) return
    if (missingParams) return
    if (acceptedRef.current) return
    if (pageState.status !== 'idle') return
    acceptedRef.current = true
    void handleAccept()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCognito, hasToken, missingParams])

  async function handleAccept() {
    if (!session) return
    setPageState({ status: 'accepting' })
    try {
      const acceptResult = await acceptOrgInvite(session, tenantId, inviteId)
      // Establish a proper tenant-scoped session for the new membership.
      const contextResult = await validateSessionContext(session, {
        tenantId: acceptResult.data.tenantId,
        role: acceptResult.data.role,
      })
      signIn({
        ...session,
        tenantId: contextResult.data.tenantId ?? undefined,
        role: contextResult.data.role,
      })
      setPageState({ status: 'success', role: acceptResult.data.role })
      setTimeout(() => {
        navigate('/org/submissions', { replace: true })
      }, 1500)
    } catch (error) {
      acceptedRef.current = false
      setPageState({ status: 'error', ...friendlyError(error) })
    }
  }

  function inviteReturnTo() {
    return `/org/accept-invite?inviteId=${encodeURIComponent(inviteId)}&tenantId=${encodeURIComponent(tenantId)}`
  }

  function startLogin() {
    setIsStartingLogin(true)
    startCognitoLogin(inviteReturnTo()).catch(() => setIsStartingLogin(false))
  }

  function switchAccount() {
    setIsStartingLogin(true)
    signOut()
    try {
      startCognitoRelogin(inviteReturnTo())
    } catch {
      setIsStartingLogin(false)
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  if (missingParams) {
    return (
      <div className="page-stack">
        <PageHero
          badge="Invitation"
          title="Invalid invite link"
          description="This link is missing required parameters. Ask the sender to copy the link again from the Users page."
        />
      </div>
    )
  }

  return (
    <div className="page-stack">
      <PageHero
        badge="Invitation"
        title="Accept your invitation"
        description="You have been invited to access a tenant portal. Sign in and accept to get started."
      />

      <section className="content-panel content-panel--narrow">
        {/* Mock-mode notice */}
        {!isCognito ? (
          <div className="designer-banner designer-banner--warning" role="status">
            <strong>Mock auth mode.</strong>
            <span>
              Invite acceptance requires Cognito authentication. This environment uses mock
              auth, so the accept call will be rejected by the backend. Set{' '}
              <code>VITE_AUTH_MODE=cognito</code> to use the real flow.
            </span>
          </div>
        ) : null}

        {/* Idle — not yet authenticated */}
        {pageState.status === 'idle' && isCognito && !hasToken ? (
          <div className="session-form">
            <p className="content-panel__body-copy">
              Sign in with your Cognito account to accept this invitation. You will be
              redirected back here automatically after sign-in.
            </p>
            <div className="session-form__actions">
              <button
                className="button button--primary"
                type="button"
                disabled={isStartingLogin}
                onClick={startLogin}
              >
                {isStartingLogin ? 'Redirecting…' : 'Sign in to accept'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Idle — authenticated, waiting for user to confirm (mock mode only) */}
        {pageState.status === 'idle' && (!isCognito || hasSession) && !hasToken ? (
          <div className="session-form">
            <p className="content-panel__body-copy">
              Click below to attempt acceptance with your current session.
            </p>
            <div className="session-form__actions">
              <button
                className="button button--primary"
                type="button"
                onClick={() => {
                  acceptedRef.current = true
                  void handleAccept()
                }}
              >
                Accept invitation
              </button>
            </div>
          </div>
        ) : null}

        {/* Accepting */}
        {pageState.status === 'accepting' ? (
          <p className="content-panel__body-copy">Accepting your invitation…</p>
        ) : null}

        {/* Success */}
        {pageState.status === 'success' ? (
          <div className="designer-banner" role="status">
            <strong>Invitation accepted!</strong>
            <span>Redirecting you to the portal…</span>
          </div>
        ) : null}

        {/* Error */}
        {pageState.status === 'error' ? (
          <div className="session-form">
            <div className="designer-banner designer-banner--warning" role="alert">
              <strong>Could not accept invitation.</strong>
              <span>{pageState.message}</span>
            </div>
            {pageState.code !== 'CONFLICT' && pageState.code !== 'NOT_FOUND' ? (
              <div className="session-form__actions">
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => {
                    acceptedRef.current = false
                    setPageState({ status: 'idle' })
                  }}
                >
                  Try again
                </button>
                {isCognito ? (
                  <button
                    className="button button--ghost"
                    type="button"
                    disabled={isStartingLogin}
                    onClick={switchAccount}
                  >
                    {isStartingLogin ? 'Redirecting…' : 'Sign in with a different account'}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}
