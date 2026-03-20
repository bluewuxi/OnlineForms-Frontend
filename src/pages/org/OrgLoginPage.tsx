import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHero } from '../../components/layout/PageHero'
import {
  completeCognitoLoginFromUrl,
  isCognitoAuthEnabled,
  startCognitoLogin,
} from '../../features/org-session/cognito'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { getPublicAuthOptions, listPublicTenants, type AuthRoleOption } from '../../lib/api'

type OrgLoginFormValues = {
  userId: string
  tenantId: string
  role: string
}

const fallbackRoles: AuthRoleOption[] = [
  { role: 'org_admin', label: 'Org Admin', requiresTenant: true },
  { role: 'org_editor', label: 'Org Editor', requiresTenant: true },
  { role: 'internal_admin', label: 'Internal Admin', requiresTenant: false },
  { role: 'platform_admin', label: 'Platform Admin', requiresTenant: true },
]

export function OrgLoginPage() {
  const { session, signIn } = useOrgSession()
  const location = useLocation()
  const navigate = useNavigate()
  const isCognitoMode = isCognitoAuthEnabled()
  const [isRedirectingToCognito, setIsRedirectingToCognito] = useState(false)
  const callbackHandledRef = useRef(false)
  const requestedReturnTo = new URLSearchParams(location.search).get('returnTo')
  const hasCognitoCallbackCode = new URLSearchParams(location.search).has('code')
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

  function resolvePostLoginPath(role: string, returnTo: string | null | undefined) {
    const isInternalRole = role === 'internal_admin'
    const fallbackReturnTo = isInternalRole ? '/internal/tenants' : '/org/submissions'
    if (returnTo && returnTo.startsWith('/')) {
      const matchesRoleBoundary = isInternalRole
        ? returnTo.startsWith('/internal/')
        : returnTo.startsWith('/org/')
      if (matchesRoleBoundary) {
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
    signIn(cognitoCallbackQuery.data.session)
    const nextPath = resolvePostLoginPath(
      cognitoCallbackQuery.data.session.role,
      cognitoCallbackQuery.data.requestedReturnTo,
    )
    navigate(nextPath, { replace: true })
  }, [cognitoCallbackQuery.data, isCognitoMode, navigate, signIn])

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

    signIn({
      userId: values.userId.trim(),
      role: values.role,
      ...(normalizedTenantId ? { tenantId: normalizedTenantId } : {}),
    })

    const returnTo = resolvePostLoginPath(values.role, requestedReturnTo)
    navigate(returnTo, { replace: true })
  })

  const roleRegister = register('role', { required: true })

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
            <p className="content-panel__body-copy">
              This environment uses Cognito Hosted UI for authentication. After
              successful sign-in, your role and tenant context are loaded from
              token claims.
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
                <p className="session-form__error">
                  Failed to complete Cognito login. Please try again.
                </p>
              ) : null}
            </div>
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
