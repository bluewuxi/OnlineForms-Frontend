import { useQuery } from '@tanstack/react-query'
import { type FormEvent, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { listPublicCourses, type CourseListItem } from '../../lib/api'
import { normalizeTenantCode } from '../../lib/routing/tenantCode'

const pageSize = 9

function normalizeStatusLabel(value?: string) {
  if (!value) {
    return 'Open'
  }

  if (value === 'upcoming') {
    return 'Opening soon'
  }

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function createStatusClassName(value?: string) {
  const normalized = value?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'open'
  return `status-pill status-pill--${normalized}`
}

function filterCoursesByStatus(courses: CourseListItem[], statusFilter: string) {
  if (statusFilter === 'all') {
    return courses
  }

  return courses.filter((course) => {
    const status = course.enrollmentStatus?.toLowerCase().replace(/[_\s]+/g, '-')
    return status === statusFilter
  })
}

export function CourseCatalogPage() {
  const { tenantCode: tenantCodeParam } = useParams()
  const tenantCode = normalizeTenantCode(tenantCodeParam ?? '')
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const initialStatusFilter = searchParams.get('status') ?? 'all'
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [statusInput, setStatusInput] = useState(initialStatusFilter)
  const cursor = searchParams.get('cursor') ?? undefined
  const statusFilter = initialStatusFilter

  const courseQuery = useQuery({
    queryKey: ['public-courses', tenantCode, initialQuery, cursor],
    queryFn: async () => {
      const response = await listPublicCourses({
        tenantCode,
        q: initialQuery || undefined,
        limit: pageSize,
        cursor,
      })

      return response.data
    },
  })

  const courses = useMemo(
    () => filterCoursesByStatus(courseQuery.data?.items ?? [], statusFilter),
    [courseQuery.data?.items, statusFilter],
  )

  function updateSearch(nextParams: Record<string, string | undefined>) {
    const merged = new URLSearchParams(searchParams)

    Object.entries(nextParams).forEach(([key, value]) => {
      if (value) {
        merged.set(key, value)
      } else {
        merged.delete(key)
      }
    })

    setSearchParams(merged)
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateSearch({
      q: searchInput.trim() || undefined,
      status: statusInput === 'all' ? undefined : statusInput,
      cursor: undefined,
    })
  }

  return (
    <div className="page-stack">
      <PageHero
        badge="Browse Training"
        badgeOutlined
        variant="public"
        title="Discover Your Next Skills Journey"
        description="Explore our wide range of professional development courses. Find the perfect training to advance your career and start your enrolment today."
      />

      <section className="content-panel content-panel--catalog-controls">
        <form
          className="search-panel"
          aria-label="Catalog filters"
          onSubmit={handleSearchSubmit}
        >
          <div className="search-panel__field">
            <label htmlFor="catalog-query">Keyword search</label>
            <input
              id="catalog-query"
              name="catalog-query"
              placeholder="Search courses..."
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <div className="search-panel__field">
            <label htmlFor="catalog-status">Enrolment status</label>
            <select
              id="catalog-status"
              name="catalog-status"
              value={statusInput}
              onChange={(event) => setStatusInput(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="open">Open for enrolment</option>
              <option value="upcoming">Starting soon</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button className="button button--primary" type="submit">
            Filter courses
          </button>
        </form>
      </section>

      {courseQuery.isLoading ? (
        <LoadingState
          title="Loading available courses"
          message="Fetching the published catalog for this training provider."
        />
      ) : null}

      {courseQuery.isError ? (
        <ErrorState
          title="We could not load the course catalog"
          message="Check the API configuration or try the request again in a moment."
        />
      ) : null}

      {!courseQuery.isLoading && !courseQuery.isError ? (
        <>
          {courses.length === 0 ? (
            <EmptyState
              title="No courses matched your search"
              message="Try a broader keyword, clear the status filter, or check back once more courses are published."
              actionLabel="Clear filters"
              onAction={() => {
                setSearchInput('')
                setStatusInput('all')
                setSearchParams(new URLSearchParams())
              }}
            />
          ) : (
            <section className="course-grid" aria-label="Available courses">
              {courses.map((course) => (
                <article key={course.id} className="course-card">
                  <h2>{course.title}</h2>
                  <p>{course.summary || 'Course summary coming soon.'}</p>
                  <div className="course-card__meta">
                    {course.deliveryMode ? (
                      <span className="course-card__meta-item">
                        <svg className="course-card__meta-icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="1" y="2" width="14" height="9" rx="1.5" />
                          <path d="M5 14h6M8 11v3" strokeLinecap="round" />
                        </svg>
                        {course.deliveryMode}
                      </span>
                    ) : null}
                    {course.durationLabel ? (
                      <span className="course-card__meta-item">
                        <svg className="course-card__meta-icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="8" cy="8" r="6" />
                          <path d="M8 5v3l2 2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {course.durationLabel}
                      </span>
                    ) : null}
                    {course.locationText ? (
                      <span className="course-card__meta-item">
                        <svg className="course-card__meta-icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M8 1.5A4 4 0 0 1 12 5.5c0 3-4 9-4 9S4 8.5 4 5.5a4 4 0 0 1 4-4z" />
                          <circle cx="8" cy="5.5" r="1.5" />
                        </svg>
                        {course.locationText}
                      </span>
                    ) : null}
                  </div>
                  <div className="course-card__footer">
                    <span
                      className={createStatusClassName(course.enrollmentStatus)}
                    >
                      {normalizeStatusLabel(course.enrollmentStatus)}
                    </span>
                    <Link
                      className="button button--outline"
                      to={course.links?.detail || `/${tenantCode}/courses/${course.id}`}
                    >
                      Review course
                    </Link>
                  </div>
                </article>
              ))}
            </section>
          )}

          <section className="pagination-panel" aria-label="Catalog pagination">
            <p>
              Showing up to {pageSize} published courses
              {initialQuery ? ` for "${initialQuery}"` : ''}.
            </p>
            {courseQuery.data?.nextCursor ? (
              <button
                className="button button--secondary"
                onClick={() =>
                  updateSearch({
                    cursor: courseQuery.data?.nextCursor || undefined,
                  })
                }
                type="button"
              >
                Load more courses
              </button>
            ) : (
              <span className="pagination-panel__hint">No more results</span>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
