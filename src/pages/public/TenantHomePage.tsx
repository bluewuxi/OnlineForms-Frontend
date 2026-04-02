import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { RichText } from '../../components/content/RichText'
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
            description="Explore published courses, enrol with confidence, and understand the provider before you begin."
            aside={
              tenantQuery.data.branding?.logoUrl ? (
                <div className="hero-card">
                  <p className="hero-card__label">Provider identity</p>
                  <img
                    alt={`${tenantQuery.data.displayName} logo`}
                    className="tenant-logo"
                    src={tenantQuery.data.branding.logoUrl}
                  />
                </div>
              ) : undefined
            }
          />

          {tenantQuery.data.description ? (
            <section className="content-panel content-panel--public-intro">
              <div className="section-heading">
                <p className="section-heading__eyebrow">About this provider</p>
                <h2>What this tenant offers</h2>
              </div>
              <RichText
                className="rich-text content-panel__body-copy content-panel__body-copy--wide"
                html={tenantQuery.data.description}
              />
            </section>
          ) : null}

          {tenantQuery.data.homePageContent ? (
            <section className="content-panel">
              <div className="section-heading">
                <p className="section-heading__eyebrow">Before you browse</p>
                <h2>Start with the essentials</h2>
              </div>
              <RichText
                className="rich-text content-panel__body-copy content-panel__body-copy--wide"
                html={tenantQuery.data.homePageContent}
              />
            </section>
          ) : null}

          <section className="content-panel content-panel--cta-strip">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Next step</p>
              <h2>Browse currently published courses</h2>
            </div>
            <div className="button-row button-row--spread">
              <Link
                className="button button--primary"
                to={tenantQuery.data.links.publishedCourses}
              >
                View published courses
              </Link>
              <Link className="button button--secondary" to="/">
                Back to providers
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
