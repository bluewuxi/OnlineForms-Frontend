import { PageHero } from '../../components/layout/PageHero'

const sampleCourses = [
  {
    title: 'Project Management Essentials',
    summary: 'A structured introduction to project delivery fundamentals.',
    status: 'Open',
  },
  {
    title: 'Data Analytics for Beginners',
    summary: 'Hands-on training for reporting, dashboards, and data literacy.',
    status: 'Open',
  },
  {
    title: 'Digital Marketing Certification',
    summary: 'Marketing strategy, channels, and campaign measurement essentials.',
    status: 'Closing soon',
  },
]

export function CourseCatalogPage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Acme Training Provider"
        title="Find your next course"
        description="Public catalog shell with search, status filters, and reusable card layouts."
      />

      <section className="search-panel" aria-label="Catalog filters">
        <div className="search-panel__field">
          <label htmlFor="catalog-query">Search courses</label>
          <input
            id="catalog-query"
            name="catalog-query"
            placeholder="Search courses..."
            type="search"
          />
        </div>
        <div className="search-panel__field">
          <label htmlFor="catalog-status">Status</label>
          <select id="catalog-status" name="catalog-status" defaultValue="all">
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="closing-soon">Closing soon</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button className="button button--primary" type="button">
          Find courses
        </button>
      </section>

      <section className="course-grid" aria-label="Available courses">
        {sampleCourses.map((course) => (
          <article key={course.title} className="course-card">
            <span className="course-card__eyebrow">Available course</span>
            <h2>{course.title}</h2>
            <p>{course.summary}</p>
            <div className="course-card__footer">
              <span className="status-pill">{course.status}</span>
              <button className="button button--secondary" type="button">
                View details
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
