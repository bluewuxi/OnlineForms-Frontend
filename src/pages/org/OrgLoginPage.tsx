import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHero } from '../../components/layout/PageHero'
import {
  completeCognitoLoginFromUrl,
  consumePostLogoutHomeFlag,
  isCognitoAuthEnabled,
  startCognitoLogin,
} from '../../features/org-session/cognito'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  getPublicAuthOptions,
  listPublicTenants,
  listSessionContexts,
  type AuthRoleOption,
  validateSessionContext,
} from '../../lib/api'
import type { OrgSessionHeaders } from '../../lib/api'
import {
  getInternalAccessDiagnosticMessage,
  toLoginDiagnosticMessage,
} from './loginDiagnostics'

type OrgLoginFormValues = {
  userId: string
  tenantId: string
  role: string
}

const fallbackRoles: AuthRoleOption[] = [
  { role: 'org_viewer', label: 'Org Viewer', requiresTenant: true },
  { role: 'org_admin', label: 'Org Admin', requiresTenant: true },
  { role: 'org_editor', label: 'Org Editor', requiresTenant: true },
  { role: 'internal_admin', label: 'Internal Admin', requiresTenant: false },
  { role: 'platform_support', label: 'Platform Support', requiresTenant: true },
]

const ROLE_LABELS: Record<string, string> = {
  org_viewer: 'Org Viewer',
  org_editor: 'Org Editor',
  org_admin: 'Org Admin',
  internal_admin: 'Internal Admin',
  platform_support: 'Platform Support',
}

function hasInternalCapability(role: string | null | undefined) {
  return role === 'internal_admin' || role === 'platform_support'
}

export function OrgLoginPage() {
  const { session, signIn, signOut } = useOrgSession()
  const location = useLocation()
  const navigate = useNavigate()
  const isCognitoMode = isCognitoAuthEnabled()
  const [isRedirectingToCognito, setIsRedirectingToCognito] = useState(false)
  const [pendingCognitoSession, setPendingCognitoSession] =
    useState<OrgSessionHeaders | null>(null)
  const [selectedCognitoTenantId, setSelectedCognitoTenantId] = useState('')
  const [selectedCognitoRole, setSelectedCognitoRole] = useState('')
  const [cognitoContextError, setCognitoContextError] = useState<string | null>(null)
  const [isApplyingCognitoContext, setIsApplyingCognitoContext] = useState(false)
  const [postLoginReturnTo, setPostLoginReturnTo] = useState<string | null>(null)
  const callbackHandledRef = useRef(false)
  const requestedReturnTo = new URLSearchParams(location.search).get('returnTo')
  const hasCognitoCallbackCode = new URLSearchParams(location.search).has('code')
  const activeCognitoSession =
    pendingCognitoSession || (session?.authProvider === 'cognito' ? session : null)
  const tenantQuery = useQuery({
    queryKey: ['public-tenants-for-login'],
    queryFn: async () => {
      const response = await listPublicTenants()
      return response.data
    },
  })
  const authOptionsQuery = useQuery({
    queryKey: ['public-auth-options'],
    queryFn: async () => {
      const response = await getPublicAuthOptions()
      return response.data.roles
    },
  })
  const roleOptions = authOptionsQuery.data && authOptionsQuery.data.length > 0
    ? authOptionsQuery.data
    : fallbackRoles
  const { control, register, handleSubmit, formState, setError, clearErrors, getValues, setValue } = useForm<OrgLoginFormValues>({
    defaultValues: {
      userId: session?.userId || '',
      tenantId: session?.tenantId || '',
      role: session?.role || 'org_admin',
    },
  })
  const selectedRole = useWatch({ control, name: 'role' })
  const cognitoCallbackQuery = useQuery({
    queryKey: ['org-cognito-callback', location.search],
    queryFn: async () => completeCognitoLoginFromUrl(location.search),
    enabled: isCognitoMode && hasCognitoCallbackCode,
    retry: false,
  })
  const cognitoCallbackErrorMessage =
    cognitoCallbackQuery.error instanceof Error
      ? toLoginDiagnosticMessage('callback', cognitoCallbackQuery.error.message)
      : toLoginDiagnosticMessage('callback', undefined)
  const sessionContextsQuery = useQuery({
    queryKey: [
      'org-session-contexts',
      activeCognitoSession?.userId || '',
      activeCognitoSession?.accessToken || '',
    ],
    queryFn: async () => {
      if (!activeCognitoSession) {
        return {
          userId: '',
          tokenRole: '',
          canAccessInternalPortal: false,
          contexts: [],
        }
      }
      const response = await listSessionContexts(activeCognitoSession)
      return response.data
    },
    enabled: isCognitoMode && Boolean(activeCognitoSession),
  })
  const sessionContextsErrorMessage =
    sessionContextsQuery.error instanceof Error
      ? toLoginDiagnosticMessage('contexts', sessionContextsQuery.error.message)
      : toLoginDiagnosticMessage('contexts', undefined)

  useEffect(() => {
    if (!isCognitoMode || hasCognitoCallbackCode) {
      return
    }
    if (consumePostLogoutHomeFlag()) {
      navigate('/', { replace: true })
    }
  }, [hasCognitoCallbackCode, isCognitoMode, navigate])

  function resolvePostLoginPath(role: string, returnTo: string | null | undefined) {
    const isInternalRole = role === 'internal_admin'
    const fallbackReturnTo = isInternalRole ? '/internal/tenants' : '/org/courses'
    if (returnTo && returnTo.startsWith('/')) {
      const blockedPaths = ['/org/login', '/management']
      const isBlockedPath = blockedPaths.some(
        (blockedPath) =>
          returnTo === blockedPath || returnTo.startsWith(`${blockedPath}?`),
      )
      const matchesRoleBoundary = isInternalRole
        ? returnTo.startsWith('/internal/')
        : returnTo.startsWith('/org/')
      if (matchesRoleBoundary && !isBlockedPath) {
        return returnTo
      }
    }
    return fallbackReturnTo
  }

  useEffect(() => {
    if (!isCognitoMode || callbackHandledRef.current) {
      return
    }
    if (!cognitoCallbackQuery.data) {
      return
    }
    callbackHandledRef.current = true
    setPendingCognitoSession(cognitoCallbackQuery.data.session)
    signIn(cognitoCallbackQuery.data.session)
    const resolvedReturnTo = cognitoCallbackQuery.data.requestedReturnTo || requestedReturnTo
    setPostLoginReturnTo(resolvedReturnTo)
    // Fast-track: invite acceptance does not require context selection — the
    // accept endpoint only needs a valid bearer token, not a tenant membership.
    if (resolvedReturnTo?.startsWith('/org/accept-invite')) {
      navigate(resolvedReturnTo, { replace: true })
    }
  }, [cognitoCallbackQuery.data, isCognitoMode, navigate, requestedReturnTo, signIn])

  useEffect(() => {
    if (!isCognitoMode || !sessionContextsQuery.data) {
      return
    }
    const activeContexts = (sessionContextsQuery.data.contexts || []).filter(
      (context) => context.status === 'active',
    )
    if (activeContexts.length === 0) {
      setSelectedCognitoTenantId('')
      setSelectedCognitoRole('')
      return
    }
    if (!selectedCognitoTenantId) {
      setSelectedCognitoTenantId(activeContexts[0].tenantId)
      setSelectedCognitoRole(activeContexts[0].roles[0] || '')
      return
    }
    const selectedContext = activeContexts.find(
      (context) => context.tenantId === selectedCognitoTenantId,
    )
    if (!selectedContext) {
      setSelectedCognitoTenantId(activeContexts[0].tenantId)
      setSelectedCognitoRole(activeContexts[0].roles[0] || '')
      return
    }
    if (!selectedContext.roles.includes(selectedCognitoRole)) {
      setSelectedCognitoRole(selectedContext.roles[0] || '')
    }
  }, [
    isCognitoMode,
    selectedCognitoRole,
    selectedCognitoTenantId,
    sessionContextsQuery.data,
  ])

  const onSubmit = handleSubmit((values) => {
    if (isCognitoMode) {
      return
    }
    const roleMeta = roleOptions.find((row) => row.role === values.role)
    const requiresTenant = roleMeta ? roleMeta.requiresTenant : true
    const normalizedTenantId = values.tenantId.trim()
    if (requiresTenant && !normalizedTenantId) {
      setError('tenantId', {
        type: 'required',
        message: 'Tenant is required for the selected role.',
      })
      return
    }
    clearErrors('tenantId')
    const normalizedUserId = values.userId.trim()

    signIn({
      userId: normalizedUserId,
      username: normalizedUserId,
      preferredName: normalizedUserId.includes('@') ? undefined : normalizedUserId,
      role: values.role,
      ...(normalizedTenantId ? { tenantId: normalizedTenantId } : {}),
    })

    const returnTo = resolvePostLoginPath(values.role, requestedReturnTo)
    navigate(returnTo, { replace: true })
  })

  const roleRegister = register('role', { required: true })
  const activeContexts = (sessionContextsQuery.data?.contexts || []).filter(
    (context) => context.status === 'active',
  )
  const selectedContext = activeContexts.find(
    (context) => context.tenantId === selectedCognitoTenantId,
  )
  const cognitoTenantRoleOptions = selectedContext?.roles || []
  const tokenRole = sessionContextsQuery.data?.tokenRole || activeCognitoSession?.role || ''
  const canOpenInternalManagement =
    Boolean(sessionContextsQuery.data?.canAccessInternalPortal) || hasInternalCapability(tokenRole)
  const internalAccessDiagnosticMessage = getInternalAccessDiagnosticMessage({
    canOpenInternalManagement,
    hasActiveContexts: activeContexts.length > 0,
    tokenRole,
  })

  async function applyCognitoContext() {
    if (!activeCognitoSession) {
      return
    }
    if (!selectedCognitoTenantId || !selectedCognitoRole) {
      setCognitoContextError('Select both tenant and role to continue.')
      return
    }
    setCognitoContextError(null)
    setIsApplyingCognitoContext(true)
    try {
      const response = await validateSessionContext(activeCognitoSession, {
        tenantId: selectedCognitoTenantId,
        role: selectedCognitoRole,
      })
      signIn({
        ...activeCognitoSession,
        tenantId: response.data.tenantId ?? undefined,
        role: response.data.role,
      })
      const nextPath = resolvePostLoginPath(
        response.data.role,
        postLoginReturnTo || requestedReturnTo,
      )
      navigate(nextPath, { replace: true })
    } catch (error) {
      setCognitoContextError(
        error instanceof Error
          ? toLoginDiagnosticMessage('context_validation', error.message)
          : toLoginDiagnosticMessage('context_validation', undefined),
      )
    } finally {
      setIsApplyingCognitoContext(false)
    }
  }

  async function openInternalManagement() {
    if (!activeCognitoSession || !canOpenInternalManagement) {
      return
    }
    setCognitoContextError(null)
    setIsApplyingCognitoContext(true)
    try {
      const response = await validateSessionContext(activeCognitoSession, {
        role: 'internal_admin',
        tenantId: null,
      })
      signIn({
        ...activeCognitoSession,
        role: response.data.role,
        tenantId: undefined,
      })
      navigate('/internal/tenants', { replace: true })
    } catch (error) {
      setCognitoContextError(
        error instanceof Error
          ? toLoginDiagnosticMessage('context_validation', error.message)
          : toLoginDiagnosticMessage('context_validation', undefined),
      )
    } finally {
      setIsApplyingCognitoContext(false)
    }
  }

  function restartCognitoSignIn() {
    signOut()
    setPendingCognitoSession(null)
    setPostLoginReturnTo(null)
    setSelectedCognitoTenantId('')
    setSelectedCognitoRole('')
    setCognitoContextError(null)
    setIsRedirectingToCognito(true)
    startCognitoLogin(requestedReturnTo || undefined).catch(() => {
      setIsRedirectingToCognito(false)
    })
  }

  return (
    <div className="page-stack">
      <PageHero
        badge="Org access"
        title="Management login"
        description="Sign in with your managed Cognito account. Role and tenant access are enforced from authenticated claims and membership policies."
      />

      <section className="content-panel content-panel--narrow">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Authentication</p>
          <h2>Access management portal</h2>
        </div>
        {isCognitoMode ? (
          <>
            {!activeCognitoSession ? (
              <>
                <p className="content-panel__body-copy">
                  This environment uses Cognito Hosted UI for authentication.
                  Sign in first, then select tenant and role context.
                </p>
                <div className="session-form__actions">
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => {
                      setIsRedirectingToCognito(true)
                      startCognitoLogin(requestedReturnTo || undefined).catch(() => {
                        setIsRedirectingToCognito(false)
                      })
                    }}
                    disabled={isRedirectingToCognito || cognitoCallbackQuery.isLoading}
                  >
                    {isRedirectingToCognito || cognitoCallbackQuery.isLoading
                      ? 'Redirecting...'
                      : 'Continue with Cognito'}
                  </button>
                  {cognitoCallbackQuery.isError ? (
                    <>
                      <p className="session-form__error">
                        {cognitoCallbackErrorMessage}
                      </p>
                      <button
                        className="button button--ghost"
                        type="button"
                        onClick={restartCognitoSignIn}
                        disabled={isRedirectingToCognito}
                      >
                        Retry sign-in
                      </button>
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="session-form">
                <p className="content-panel__body-copy">
                  Select the tenant and role context for this login session.
                </p>
                {sessionContextsQuery.isError ? (
                  <p className="session-form__error">{sessionContextsErrorMessage}</p>
                ) : null}
                <label className="session-form__field">
                  <span>Tenant</span>
                  <select
                    value={selectedCognitoTenantId}
                    onChange={(event) => {
                      setSelectedCognitoTenantId(event.target.value)
                      setCognitoContextError(null)
                    }}
                    disabled={sessionContextsQuery.isLoading || activeContexts.length === 0}
                  >
                    <option value="">Select tenant</option>
                    {activeContexts.map((context) => {
                      const tenantMeta = (tenantQuery.data || []).find(
                        (tenant) => tenant.tenantId === context.tenantId,
                      )
                      return (
                        <option key={context.tenantId} value={context.tenantId}>
                          {tenantMeta
                            ? `${tenantMeta.displayName} (${tenantMeta.tenantCode})`
                            : context.tenantId}
                        </option>
                      )
                    })}
                  </select>
                </label>
                <label className="session-form__field">
                  <span>Role</span>
                  <select
                    value={selectedCognitoRole}
                    onChange={(event) => {
                      setSelectedCognitoRole(event.target.value)
                      setCognitoContextError(null)
                    }}
                    disabled={!selectedContext || cognitoTenantRoleOptions.length === 0}
                  >
                    <option value="">Select role</option>
                    {cognitoTenantRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role] ?? role}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="session-form__actions">
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => {
                      void applyCognitoContext()
                    }}
                    disabled={
                      isApplyingCognitoContext ||
                      !selectedCognitoTenantId ||
                      !selectedCognitoRole
                    }
                  >
                    {isApplyingCognitoContext
                      ? 'Validating...'
                      : 'Continue to management'}
                  </button>
                  {canOpenInternalManagement ? (
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => {
                        void openInternalManagement()
                      }}
                      disabled={isApplyingCognitoContext}
                    >
                      Internal Management
                    </button>
                  ) : null}
                  {(cognitoContextError ||
                    (activeContexts.length === 0 && !sessionContextsQuery.isLoading)) ? (
                    <p className="session-form__error">
                      {cognitoContextError ||
                        'No active tenant membership found for this account.'}
                    </p>
                  ) : null}
                  {!sessionContextsQuery.isLoading ? (
                    <p className="content-panel__body-copy">
                      {internalAccessDiagnosticMessage}
                    </p>
                  ) : null}
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={restartCognitoSignIn}
                    disabled={isRedirectingToCognito || isApplyingCognitoContext}
                  >
                    Use different account
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="content-panel__body-copy">
              Local/mock mode uses session headers for development and
              troubleshooting.
            </p>
            <form className="session-form" onSubmit={onSubmit}>
              <label className="session-form__field">
                <span>Username</span>
                <input
                  {...register('userId', { required: true })}
                  autoComplete="username"
                  placeholder="org-user-001"
                  type="text"
                />
              </label>
              <label className="session-form__field">
                <span>Tenant</span>
                <select
                  {...register('tenantId')}
                  disabled={tenantQuery.isLoading || selectedRole === 'internal_admin'}
                >
                  <option value="">Select tenant</option>
                  {(tenantQuery.data || []).map((tenant) => (
                    <option key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.displayName} ({tenant.tenantCode})
                    </option>
                  ))}
                </select>
                {formState.errors.tenantId?.message ? (
                  <p className="session-form__error">
                    {formState.errors.tenantId.message}
                  </p>
                ) : null}
              </label>
              <label className="session-form__field">
                <span>Role</span>
                <select
                  {...roleRegister}
                  onChange={(event) => {
                    roleRegister.onChange(event)
                    if (event.target.value === 'internal_admin' && getValues('tenantId')) {
                      setValue('tenantId', '')
                      clearErrors('tenantId')
                    }
                  }}
                >
                  {roleOptions.map((role) => (
                    <option key={role.role} value={role.role}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {selectedRole === 'internal_admin' ? (
                  <p className="content-panel__body-copy">
                    Tenant is optional for Internal Admin.
                  </p>
                ) : null}
              </label>
              <div className="session-form__actions">
                <button className="button button--primary" type="submit">
                  Continue to management
                </button>
                {formState.isSubmitted && !formState.isValid ? (
                  <p className="session-form__error">
                    Username and role are required.
                  </p>
                ) : null}
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
