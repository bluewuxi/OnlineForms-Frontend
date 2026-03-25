import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { getPublicTenantHome } from '../../lib/api'
import { normalizeTenantCode } from '../../lib/routing/tenantCode'

export function TenantHomePage() {
  const { tenantCode: tenantCodeParam } = useParams()
  const tenantCode = normalizeTenantCode(tenantCodeParam ?? '')

  const tenantQuery = useQuery({
    queryKey: ['tenant-home', tenantCode],
    queryFn: async () => {
      const response = await getPublicTenantHome(tenantCode)
      return response.data
    },
    enabled: Boolean(tenantCode),
  })

  return (
    <div className="page-stack">
      {tenantQuery.isLoading ? (
        <LoadingState
          title="Loading tenant home"
          message="Fetching tenant profile information."
        />
      ) : null}

      {tenantQuery.isError ? (
        <ErrorState
          title="We could not load this tenant"
          message="The tenant may be inactive or unavailable."
        />
      ) : null}

      {tenantQuery.data ? (
        <>
          <PageHero
            badge={tenantQuery.data.tenantCode.toUpperCase()}
            title={tenantQuery.data.displayName}
            description={
              tenantQuery.data.description ||
              'Explore this tenant and browse available published courses.'
            }
            aside={
              tenantQuery.data.branding?.logoUrl ? (
                <div className="hero-card">
                  <p className="hero-card__label">Tenant branding</p>
                  <img
                    alt={`${tenantQuery.data.displayName} logo`}
                    className="tenant-logo"
                    src={tenantQuery.data.branding.logoUrl}
                  />
                </div>
              ) : undefined
            }
          />

          {tenantQuery.data.homePageContent ? (
            <section className="content-panel">
              <div className="section-heading">
                <p className="section-heading__eyebrow">Tenant information</p>
                <h2>Welcome</h2>
              </div>
              <p className="content-panel__body-copy">
                {tenantQuery.data.homePageContent}
              </p>
            </section>
          ) : null}

          <section className="content-panel">
            <div className="button-row">
              <Link
                className="button button--primary"
                to={tenantQuery.data.links.publishedCourses}
              >
                View published courses
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
