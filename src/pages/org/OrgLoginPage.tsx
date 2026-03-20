import { useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHero } from '../../components/layout/PageHero'
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
  const requestedReturnTo = new URLSearchParams(location.search).get('returnTo')
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

  const onSubmit = handleSubmit((values) => {
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

    const isInternalRole = values.role === 'internal_admin'
    const fallbackReturnTo = isInternalRole ? '/internal/tenants' : '/org/submissions'

    let returnTo = fallbackReturnTo
    if (requestedReturnTo && requestedReturnTo.startsWith('/')) {
      const matchesRoleBoundary = isInternalRole
        ? requestedReturnTo.startsWith('/internal/')
        : requestedReturnTo.startsWith('/org/')
      if (matchesRoleBoundary) {
        returnTo = requestedReturnTo
      }
    }
    navigate(returnTo, { replace: true })
  })

  const roleRegister = register('role', { required: true })

  return (
    <div className="page-stack">
      <PageHero
        badge="Org access"
        title="MVP organization login"
        description="A temporary header-based auth shell for org users before the real authentication flow is introduced."
      />

      <section className="content-panel content-panel--narrow">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Session fields</p>
          <h2>Capture management session headers used by the MVP backend</h2>
        </div>
        <p className="content-panel__body-copy">
          These values are stored locally for the MVP session and attached to
          org API requests through the shared client layer.
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
      </section>
    </div>
  )
}
