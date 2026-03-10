import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { listCourses } from '../../lib/api'

function formatDateRange(startDate: string, endDate: string) {
  return `${startDate} to ${endDate}`
}

function formatCourseStatus(status: string) {
  return status.replace(/_/g, ' ')
}

export function CoursesPage() {
  const { session } = useOrgSession()
  const coursesQuery = useQuery({
    queryKey: ['org-courses', session?.tenantId],
    queryFn: async () => {
      if (!session) {
        return { items: [], nextCursor: null }
      }

      const response = await listCourses(session)
      return response.data
    },
    enabled: Boolean(session),
  })

  return (
    <div className="page-stack">
      <PageHero
        badge="Org courses"
        title="Tenant course management"
        description="Browse the tenant course catalog, check publication readiness, and move into edit or form-design workflows."
        aside={
          <div className="hero-card">
            <p className="hero-card__label">Course workspace</p>
            <ul className="hero-card__list">
              <li>Tenant: {session?.tenantId || 'No active session'}</li>
              <li>Scope: Course list and publishing workflows</li>
            </ul>
          </div>
        }
      />

      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Course actions</p>
          <h2>Start a new course or open an existing one</h2>
        </div>
        <div className="button-row">
          <Link className="button button--primary" to="/org/courses/new">
            Create course
          </Link>
        </div>
      </section>

      {coursesQuery.isLoading ? (
        <LoadingState
          title="Loading tenant courses"
          message="Fetching current draft, published, and archived courses for this tenant."
        />
      ) : null}

      {coursesQuery.isError ? (
        <ErrorState
          title="We could not load tenant courses"
          message="The course list request failed. Check the org session or retry the request."
        />
      ) : null}

      {!coursesQuery.isLoading && !coursesQuery.isError ? (
        coursesQuery.data?.items.length ? (
          <section className="content-panel">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Course list</p>
              <h2>Current tenant courses</h2>
            </div>
            <div className="responsive-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Course</th>
                    <th scope="col">Delivery</th>
                    <th scope="col">Schedule</th>
                    <th scope="col">Status</th>
                    <th scope="col">Visibility</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesQuery.data.items.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <strong>{course.title}</strong>
                        <div className="table-subtext">
                          {course.shortDescription}
                        </div>
                      </td>
                      <td>{course.deliveryMode}</td>
                      <td>{formatDateRange(course.startDate, course.endDate)}</td>
                      <td>
                        <span
                          className={`status-pill status-pill--${course.status}`}
                        >
                          {formatCourseStatus(course.status)}
                        </span>
                      </td>
                      <td>{course.publicVisible ? 'Public' : 'Internal only'}</td>
                      <td>
                        <div className="button-row">
                          <Link
                            className="button button--secondary"
                            to={`/org/courses/${course.id}`}
                          >
                            Edit
                          </Link>
                          <Link
                            className="button button--ghost"
                            to={`/org/courses/${course.id}/form`}
                          >
                            Form designer
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <EmptyState
            title="No courses are available yet"
            message="Create the first tenant course to begin the publishing and enrollment workflow."
            actionLabel="Create course"
            onAction={() => {
              window.location.assign('/org/courses/new')
            }}
          />
        )
      ) : null}
    </div>
  )
}
