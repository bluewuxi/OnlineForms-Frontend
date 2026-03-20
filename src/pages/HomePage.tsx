import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
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
        badge="Frontend MVP"
        title="OnlineForms Frontend"
        description="Tenant-first public entry and internal management access."
        aside={
          <div className="hero-card">
            <p className="hero-card__label">Ready routes</p>
            <ul className="hero-card__list">
              <li>Tenant course catalog and detail views</li>
              <li>Internal management portal entry</li>
              <li>Org operational routes</li>
            </ul>
          </div>
        }
      />

      <section className="content-card-grid">
        <Link className="destination-card" to="/">
          <span className="destination-card__eyebrow">Home</span>
          <h2>Tenant directory</h2>
          <p>Choose a tenant card below to browse published courses.</p>
        </Link>
        <Link className="destination-card" to="/org/login">
          <span className="destination-card__eyebrow">Internal Management</span>
          <h2>Open internal portal</h2>
          <p>Sign in to manage tenant and organization operations.</p>
        </Link>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Tenants</p>
          <h2>Browse by tenant</h2>
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
            <div className="course-grid" aria-label="Tenant cards">
              {tenantsQuery.data.map((tenant) => (
                <Link
                  className="destination-card"
                  key={tenant.tenantCode}
                  to={`/${tenant.tenantCode}`}
                >
                  <span className="destination-card__eyebrow">
                    {tenant.tenantCode}
                  </span>
                  <h3>{tenant.displayName}</h3>
                  <p>
                    {tenant.description ||
                      'Open this tenant public catalog and browse courses.'}
                  </p>
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

      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Global UX states</p>
          <h2>Reusable patterns ready for data-driven pages</h2>
        </div>
        <div className="state-grid">
          <LoadingState
            title="Loading page data"
            message="Use this treatment for page sections while requests are in flight."
          />
          <EmptyState
            title="No matching records"
            message="Use clear explanations with a single next action."
            actionLabel="Adjust filters"
          />
          <ErrorState
            title="Something interrupted the request"
            message="Route-level or panel-level fetch failures can reuse this pattern."
          />
        </div>
      </section>
    </div>
  )
}
