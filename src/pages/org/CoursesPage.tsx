import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { OrgActivityFeed } from '../../components/layout/OrgActivityFeed'
import { OrgWorkspaceNav } from '../../components/layout/OrgWorkspaceNav'
import { PageHero } from '../../components/layout/PageHero'
import { useCanWrite } from '../../features/org-session/useCanWrite'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { listCourses } from '../../lib/api'

const iconCourseList = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" aria-hidden="true">
    <path d="M2 4h12M2 8h12M2 12h8" strokeLinecap="round" />
  </svg>
)

const iconCreateCourse = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 5v6M5 8h6" strokeLinecap="round" />
  </svg>
)

const iconSettings = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" aria-hidden="true">
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M3.5 12.5l1.5-1.5M11 5l1.5-1.5" strokeLinecap="round" />
  </svg>
)

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
  const canWrite = useCanWrite()
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
        variant="org"
        title="Manage Your Organisation's Training Courses"
        description="From creation to enrolment, view and manage the full lifecycle of your training programmes."
      />

      <div className="org-courses-shell">
        <div className="org-courses-shell__main">
          <OrgWorkspaceNav
            eyebrow="Course workflow"
            title="Move from course record to published intake"
            items={[
              {
                label: 'Course list',
                description: 'Review current drafts, published intakes, and archived courses.',
                to: '/org/courses',
                state: 'current',
                icon: iconCourseList,
              },
              ...(canWrite ? [{
                label: 'Create course',
                description: 'Start a new course record before moving into form design.',
                to: '/org/courses/new',
                icon: iconCreateCourse,
              }] : []),
              {
                label: 'Settings',
                description: 'Open tenant branding and audit tools.',
                to: '/org/branding',
                icon: iconSettings,
              },
            ]}
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
                  {canWrite ? (
                    <div className="section-header__actions">
                      <Link className="button button--primary" to="/org/courses/new">
                        Create course
                      </Link>
                    </div>
                  ) : null}
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
                          className="button button--outline"
                          to={`/org/courses/${course.id}`}
                        >
                          Open details
                        </Link>
                        <Link
                          className="button button--ghost-teal"
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
                message={canWrite
                  ? 'Create the first course to begin the publishing and enrollment workflow.'
                  : 'No courses have been created for this tenant yet.'}
                actionLabel={canWrite ? 'Create course' : undefined}
                onAction={canWrite ? () => navigate('/org/courses/new') : undefined}
              />
            )
          ) : null}
        </div>

        <OrgActivityFeed />
      </div>
    </div>
  )
}
