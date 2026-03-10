import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHero } from '../../components/layout/PageHero'
import { useOrgSession } from '../../features/org-session/useOrgSession'

type OrgLoginFormValues = {
  userId: string
  tenantId: string
  role: string
}

export function OrgLoginPage() {
  const { session, signIn } = useOrgSession()
  const location = useLocation()
  const navigate = useNavigate()
  const requestedReturnTo = new URLSearchParams(location.search).get('returnTo')
  const returnTo =
    requestedReturnTo && requestedReturnTo.startsWith('/')
      ? requestedReturnTo
      : '/org/submissions'
  const { register, handleSubmit, formState } = useForm<OrgLoginFormValues>({
    defaultValues: {
      userId: session?.userId || '',
      tenantId: session?.tenantId || '',
      role: session?.role || 'org_admin',
    },
  })

  const onSubmit = handleSubmit((values) => {
    signIn(values)
    navigate(returnTo, { replace: true })
  })

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
          <h2>Capture the org request headers used by the MVP backend</h2>
        </div>
        <p className="content-panel__body-copy">
          These values are stored locally for the MVP session and attached to
          org API requests through the shared client layer.
        </p>
        <form className="session-form" onSubmit={onSubmit}>
          <label className="session-form__field">
            <span>x-user-id</span>
            <input
              {...register('userId', { required: true })}
              autoComplete="username"
              placeholder="org-user-001"
              type="text"
            />
          </label>
          <label className="session-form__field">
            <span>x-tenant-id</span>
            <input
              {...register('tenantId', { required: true })}
              placeholder="tenant-123"
              type="text"
            />
          </label>
          <label className="session-form__field">
            <span>x-role</span>
            <input
              {...register('role', { required: true })}
              placeholder="org_admin"
              type="text"
            />
          </label>
          <div className="session-form__actions">
            <button className="button button--primary" type="submit">
              Continue to org portal
            </button>
            {formState.isSubmitted && !formState.isValid ? (
              <p className="session-form__error">
                All session fields are required.
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  )
}
