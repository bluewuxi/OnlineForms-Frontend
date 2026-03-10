import { PageHero } from '../../components/layout/PageHero'

export function OrgLoginPage() {
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
          <h2>Header values captured in the next task</h2>
        </div>
        <div className="field-grid">
          <div className="field-card">
            <span>x-user-id</span>
            <strong>Org user identifier</strong>
          </div>
          <div className="field-card">
            <span>x-tenant-id</span>
            <strong>Tenant context for org APIs</strong>
          </div>
          <div className="field-card">
            <span>x-role</span>
            <strong>Role header used by the MVP backend shell</strong>
          </div>
        </div>
      </section>
    </div>
  )
}
