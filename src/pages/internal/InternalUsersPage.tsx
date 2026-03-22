import { PageHero } from '../../components/layout/PageHero'

export function InternalUsersPage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Management"
        title="Internal users"
        description="User management workflow will be implemented in the next task."
      />
      <section className="content-panel content-panel--narrow">
        <p>
          This page is reserved for internal-access user list, add-by-email,
          and remove-access actions.
        </p>
      </section>
    </div>
  )
}
