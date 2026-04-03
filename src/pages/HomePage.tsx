import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { RichText } from '../components/content/RichText'
import { EmptyState } from '../components/feedback/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState'
import { LoadingState } from '../components/feedback/LoadingState'
import { PageHero } from '../components/layout/PageHero'
import { listPublicTenants } from '../lib/api'

export function HomePage() {
  const tenantsQuery = useQuery({
    queryKey: ['public-tenants'],
    queryFn: async () => {
      const response = await listPublicTenants()
      return response.data
    },
  })

  return (
    <div className="page-stack">
      <PageHero
        badge="Public portal"
        title="Choose a training provider, then enrol with confidence."
        description="Browse active providers, compare published courses, and move into a clean application flow without losing context."
      />

      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Providers</p>
          <h2>Browse active training providers</h2>
        </div>

        {tenantsQuery.isLoading ? (
          <LoadingState
            title="Loading tenant directory"
            message="Fetching active tenants for public navigation."
          />
        ) : null}

        {tenantsQuery.isError ? (
          <ErrorState
            title="We could not load tenants"
            message="Retry in a moment or check API availability."
          />
        ) : null}

        {!tenantsQuery.isLoading && !tenantsQuery.isError ? (
          tenantsQuery.data && tenantsQuery.data.length > 0 ? (
            <div className="tenant-directory-grid" aria-label="Tenant cards">
              {tenantsQuery.data.map((tenant) => (
                <Link
                  className="tenant-directory-card"
                  key={tenant.tenantCode}
                  to={`/${tenant.tenantCode}`}
                >
                  <span className="tenant-directory-card__eyebrow">
                    Training Provider
                  </span>
                  <h3>{tenant.displayName}</h3>
                  {tenant.description ? (
                    <RichText
                      className="tenant-directory-card__summary rich-text"
                      html={tenant.description}
                    />
                  ) : (
                    <p className="tenant-directory-card__summary">
                      Open this provider page to browse currently published courses.
                    </p>
                  )}
                  <span className="tenant-directory-card__cta">
                    Browse provider
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active tenants available"
              message="No tenant cards can be displayed yet."
            />
          )
        ) : null}
      </section>

      <section className="content-panel content-panel--editorial">
        <div className="section-heading">
          <p className="section-heading__eyebrow">How it works</p>
          <h2>Pick a provider, review their courses, then apply.</h2>
        </div>
        <div className="editorial-split">
          <div className="editorial-split__lead">
            <p>
              Every provider runs its own public course space. Start with the
              provider directory, open a tenant page to understand what they
              offer, then move straight into the published course list.
            </p>
          </div>
          <div className="editorial-steps" aria-label="Public browsing steps">
            <div className="editorial-step">
              <span className="editorial-step__index">01</span>
              <div>
                <strong>Browse providers</strong>
                <p>Open the tenant that matches the training offer you want.</p>
              </div>
            </div>
            <div className="editorial-step">
              <span className="editorial-step__index">02</span>
              <div>
                <strong>Review published courses</strong>
                <p>Compare delivery mode, dates, and enrolment status quickly.</p>
              </div>
            </div>
            <div className="editorial-step">
              <span className="editorial-step__index">03</span>
              <div>
                <strong>Start the application</strong>
                <p>Move into the course detail page and submit the enrolment form.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
