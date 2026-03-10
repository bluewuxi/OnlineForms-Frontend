import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState'
import { LoadingState } from '../components/feedback/LoadingState'
import { PageHero } from '../components/layout/PageHero'

export function HomePage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Frontend MVP"
        title="OnlineForms Frontend"
        description="Shared layout, route skeletons, and reusable UX states for the public and organization experiences."
        aside={
          <div className="hero-card">
            <p className="hero-card__label">Ready routes</p>
            <ul className="hero-card__list">
              <li>Public catalog and detail views</li>
              <li>Org login, submissions, and audit pages</li>
              <li>Branding utility placeholder</li>
            </ul>
          </div>
        }
      />

      <section className="content-card-grid">
        <Link className="destination-card" to="/t/acme-training/courses">
          <span className="destination-card__eyebrow">Public portal</span>
          <h2>Browse the course catalog</h2>
          <p>Use the initial tenant route and course discovery flow.</p>
        </Link>
        <Link className="destination-card" to="/org/login">
          <span className="destination-card__eyebrow">Org portal</span>
          <h2>Open the MVP login shell</h2>
          <p>Start the org-side workflow and review routes.</p>
        </Link>
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
