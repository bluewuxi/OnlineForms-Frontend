import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { PageHero } from '../../components/layout/PageHero'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { listCourses } from '../../lib/api'

function formatLocalDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function formatDateRange(startDate: string, endDate: string) {
  return `${formatLocalDate(startDate)} – ${formatLocalDate(endDate)}`
}

function courseStatusTone(
  status: string,
): 'success' | 'warning' | 'muted' {
  if (status === 'published') return 'success'
  if (status === 'draft') return 'warning'
  return 'muted'
}

export function CoursesPage() {
  const { session } = useOrgSession()
  const navigate = useNavigate()
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
        badge="Org workspace"
        title="Courses"
        description="Create and manage course records, then move into form design, publishing, and submission review."
      />

      {coursesQuery.isLoading ? (
        <LoadingState
          title="Loading courses"
          message="Fetching draft, published, and archived courses for this tenant."
        />
      ) : null}

      {coursesQuery.isError ? (
        <ErrorState
          title="Could not load courses"
          message="The course list request failed. Check the org session or retry."
        />
      ) : null}

      {!coursesQuery.isLoading && !coursesQuery.isError ? (
        coursesQuery.data?.items.length ? (
          <section className="content-panel">
            <div className="section-header">
              <div className="section-header__copy">
                <p className="section-heading__eyebrow">Course list</p>
                <h2>{coursesQuery.data.items.length} course{coursesQuery.data.items.length !== 1 ? 's' : ''}</h2>
              </div>
              <div className="section-header__actions">
                <Link className="button button--primary" to="/org/courses/new">
                  Create course
                </Link>
              </div>
            </div>

            <div className="org-course-card-grid">
              {coursesQuery.data.items.map((course) => (
                <div key={course.id} className="org-course-card">
                  <div className="org-course-card__header">
                    <div className="org-course-card__title-row">
                      <strong className="org-course-card__title">{course.title}</strong>
                      <StatusChip tone={courseStatusTone(course.status)}>
                        {course.status}
                      </StatusChip>
                    </div>
                    {course.shortDescription ? (
                      <p className="org-course-card__summary">{course.shortDescription}</p>
                    ) : null}
                  </div>

                  <div className="org-course-card__meta">
                    <span className="org-course-card__meta-item">
                      <span className="org-course-card__meta-label">Delivery</span>
                      {course.deliveryMode}
                    </span>
                    <span className="org-course-card__meta-item">
                      <span className="org-course-card__meta-label">Dates</span>
                      {formatDateRange(course.startDate, course.endDate)}
                    </span>
                    <span className="org-course-card__meta-item">
                      <span className="org-course-card__meta-label">Form</span>
                      {course.activeFormVersion
                        ? `Version ${course.activeFormVersion}`
                        : 'No form yet'}
                    </span>
                  </div>

                  <div className="org-course-card__actions">
                    <Link
                      className="button button--primary"
                      to={`/org/courses/${course.id}`}
                    >
                      Open details
                    </Link>
                    <Link
                      className="button button--ghost"
                      to={`/org/courses/${course.id}/form`}
                    >
                      Form designer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <EmptyState
            title="No courses yet"
            message="Create the first course to begin the publishing and enrollment workflow."
            actionLabel="Create course"
            onAction={() => navigate('/org/courses/new')}
          />
        )
      ) : null}
    </div>
  )
}
