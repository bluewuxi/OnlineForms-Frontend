import { ErrorState } from '../../components/feedback/ErrorState'
import { PageHero } from '../../components/layout/PageHero'

export function AuditPage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Org audit"
        title="Tenant audit activity"
        description="Operational visibility for actors, actions, resources, and trace identifiers."
      />

      <ErrorState
        title="Audit filters are waiting for data wiring"
        message="The route skeleton is ready. Data fetching and filter helpers will land in the next foundation tasks."
        retryLabel="Reload preview"
      />
    </div>
  )
}
