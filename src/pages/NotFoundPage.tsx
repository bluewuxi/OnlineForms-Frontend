import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="content-panel content-panel--narrow">
      <p className="section-heading__eyebrow">Not found</p>
      <h1>We could not find that page</h1>
      <p>
        The requested route does not exist in the MVP route map. Return to the
        home page or jump into the sample catalog.
      </p>
      <div className="button-row">
        <Link className="button button--primary" to="/">
          Go home
        </Link>
        <Link className="button button--secondary" to="/acme-training/courses">
          Open sample catalog
        </Link>
      </div>
    </section>
  )
}
