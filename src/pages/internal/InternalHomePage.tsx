import { PageHero } from '../../components/layout/PageHero'

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
          <h2>Select a function</h2>
        </div>
        <p>
          Open <strong>Tenants</strong> to maintain tenant profile information,
          or <strong>Users</strong> to manage internal access.
        </p>
      </section>
    </div>
  )
}
