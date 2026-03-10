import { EmptyState } from '../../components/feedback/EmptyState'
import { PageHero } from '../../components/layout/PageHero'

export function SubmissionsPage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Org portal"
        title="Submission review queue"
        description="A shared layout for filtered submission review, queue monitoring, and follow-up actions."
      />

      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Queue controls</p>
          <h2>Filters and list layout</h2>
        </div>
        <div className="field-grid">
          <div className="field-card">
            <span>Course</span>
            <strong>Dropdown filter slot</strong>
          </div>
          <div className="field-card">
            <span>Status</span>
            <strong>Badge-aware status filtering</strong>
          </div>
          <div className="field-card">
            <span>Date range</span>
            <strong>Cursor-friendly query controls</strong>
          </div>
        </div>
      </section>

      <EmptyState
        title="Submission list placeholders are wired"
        message="The route, shared shell, and reusable empty state are ready for API-driven list rendering."
        actionLabel="Review route shell"
      />
    </div>
  )
}
