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
        badge={tenantCode.replace(/-/g, ' ').toUpperCase()}
        title="Find your next course"
        description="Browse published courses, search by keyword, and move into the enrollment flow."
      />

      <form
        className="search-panel"
        aria-label="Catalog filters"
        onSubmit={handleSearchSubmit}
      >
        <div className="search-panel__field">
          <label htmlFor="catalog-query">Search courses</label>
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
          <label htmlFor="catalog-status">Status</label>
          <select
            id="catalog-status"
            name="catalog-status"
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="closing-soon">Closing soon</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button className="button button--primary" type="submit">
          Find courses
        </button>
      </form>

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
                  <span className="course-card__eyebrow">Available course</span>
                  <h2>{course.title}</h2>
                  <p>{course.summary || 'Course summary coming soon.'}</p>
                  <div className="course-card__meta">
                    {course.deliveryMode ? <span>{course.deliveryMode}</span> : null}
                    {course.durationLabel ? <span>{course.durationLabel}</span> : null}
                  </div>
                  <div className="course-card__footer">
                    <span
                      className={createStatusClassName(course.enrollmentStatus)}
                    >
                      {normalizeStatusLabel(course.enrollmentStatus)}
                    </span>
                    <Link
                      className="button button--secondary"
                      to={`/${tenantCode}/courses/${course.id}`}
                    >
                      View details
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
