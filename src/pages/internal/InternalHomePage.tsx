import { PageHero } from '../../components/layout/PageHero'
import { Link } from 'react-router-dom'

export function InternalHomePage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Internal Portal"
        title="Internal management"
        description="Use the top menu to manage tenants and internal-access users."
      />
      <section className="content-panel content-panel--narrow">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Portal</p>
          <h2>How to use internal tools</h2>
        </div>
        <p>
          Use <strong>Tenants</strong> for tenant profile setup and publishing
          controls. Use <strong>Users</strong> to maintain who can access the
          internal portal.
        </p>
        <div className="content-card-grid">
          <article className="destination-card">
            <p className="destination-card__eyebrow">Tenants</p>
            <h2>Manage tenant profiles</h2>
            <p>
              Create tenants, maintain descriptions and homepage content, and
              control active status.
            </p>
            <div className="button-row">
              <Link className="button button--secondary" to="/internal/tenants">
                Open tenants
              </Link>
            </div>
          </article>
          <article className="destination-card">
            <p className="destination-card__eyebrow">Users</p>
            <h2>Manage internal access</h2>
            <p>
              Grant or remove internal portal access and inspect tenant-role
              memberships per user.
            </p>
            <div className="button-row">
              <Link className="button button--secondary" to="/internal/users">
                Open users
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
