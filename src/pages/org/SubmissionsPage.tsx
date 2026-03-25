import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { PageHero } from '../../components/layout/PageHero'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { listSubmissions, type SubmissionStatus } from '../../lib/api'

const pageSize = 20
const statusOptions: Array<{ value: 'all' | SubmissionStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'canceled', label: 'Canceled' },
]

function formatSubmissionDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function submissionTone(status: SubmissionStatus) {
  if (status === 'submitted') return 'info'
  if (status === 'reviewed') return 'success'
  return 'muted'
}

export function SubmissionsPage() {
  const { session } = useOrgSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const [courseIdInput, setCourseIdInput] = useState(searchParams.get('courseId') ?? '')
  const status = (searchParams.get('status') ?? 'all') as 'all' | SubmissionStatus
  const submittedFrom = searchParams.get('submittedFrom') ?? ''
  const submittedTo = searchParams.get('submittedTo') ?? ''
  const cursor = searchParams.get('cursor') ?? undefined

  const submissionsQuery = useQuery({
    queryKey: [
      'org-submissions',
      session?.tenantId,
      courseIdInput,
      status,
      submittedFrom,
      submittedTo,
      cursor,
    ],
    queryFn: async () => {
      if (!session) {
        return { items: [], nextCursor: null }
      }

      const response = await listSubmissions(session, {
        courseId: searchParams.get('courseId') || undefined,
        status: status === 'all' ? undefined : status,
        submittedFrom: submittedFrom || undefined,
        submittedTo: submittedTo || undefined,
        limit: pageSize,
        cursor,
      })

      return response.data
    },
    enabled: Boolean(session),
  })

  function updateParams(nextParams: Record<string, string | undefined>) {
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

  function clearFilters() {
    setCourseIdInput('')
    setSearchParams(new URLSearchParams())
  }

  return (
    <div className="page-stack">
      <PageHero
        badge="Org portal"
        title="Submission review queue"
        description="A shared layout for filtered submission review, queue monitoring, and follow-up actions."
      />

      <section className="content-panel">
        <SectionHeader
          eyebrow="Queue controls"
          title="Filters and list layout"
          description="Use the shared filter surface to narrow the review queue without losing list context."
        />
        <form
          className="org-filter-grid"
          onSubmit={(event) => {
            event.preventDefault()
            updateParams({
              courseId: courseIdInput.trim() || undefined,
              cursor: undefined,
            })
          }}
        >
          <label className="session-form__field">
            <span>Course ID</span>
            <input
              onChange={(event) => setCourseIdInput(event.target.value)}
              placeholder="crs_..."
              type="text"
              value={courseIdInput}
            />
          </label>
          <label className="session-form__field">
            <span>Status</span>
            <select
              onChange={(event) =>
                updateParams({
                  status:
                    event.target.value === 'all' ? undefined : event.target.value,
                  cursor: undefined,
                })
              }
              value={status}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="session-form__field">
            <span>Submitted from</span>
            <input
              onChange={(event) =>
                updateParams({
                  submittedFrom: event.target.value || undefined,
                  cursor: undefined,
                })
              }
              type="date"
              value={submittedFrom}
            />
          </label>
          <label className="session-form__field">
            <span>Submitted to</span>
            <input
              onChange={(event) =>
                updateParams({
                  submittedTo: event.target.value || undefined,
                  cursor: undefined,
                })
              }
              type="date"
              value={submittedTo}
            />
          </label>
          <div className="org-filter-grid__actions">
            <button className="button button--primary" type="submit">
              Apply filters
            </button>
            <button
              className="button button--ghost"
              onClick={clearFilters}
              type="button"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {submissionsQuery.isLoading ? (
        <LoadingState
          title="Loading submissions"
          message="Fetching tenant submissions with the selected review filters."
        />
      ) : null}

      {submissionsQuery.isError ? (
        <ErrorState
          title="We could not load the review queue"
          message="The submissions request failed. Check the org session or retry the request."
        />
      ) : null}

      {!submissionsQuery.isLoading && !submissionsQuery.isError ? (
        submissionsQuery.data?.items.length ? (
          <>
            <section className="content-panel">
              <SectionHeader
                eyebrow="Submission list"
                title="Current tenant submissions"
                description="A list-detail review surface built on the shared system primitives."
              />
              <div className="responsive-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Applicant</th>
                      <th scope="col">Course</th>
                      <th scope="col">Status</th>
                      <th scope="col">Submitted</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionsQuery.data.items.map((submission) => (
                      <tr key={submission.id}>
                        <td>
                          <strong>{submission.applicantName || 'Unknown applicant'}</strong>
                          <div className="table-subtext">
                            {submission.applicantEmail || submission.id}
                          </div>
                        </td>
                        <td>{submission.courseTitle || submission.courseId}</td>
                        <td>
                          <StatusChip
                            className={`status-pill status-pill--${submission.status}`}
                            tone={submissionTone(submission.status)}
                          >
                            {submission.status}
                          </StatusChip>
                        </td>
                        <td>{formatSubmissionDate(submission.submittedAt)}</td>
                        <td>
                          <Link
                            className="button button--secondary"
                            to={`/org/submissions/${submission.id}`}
                          >
                            Open detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="pagination-panel" aria-label="Submission pagination">
              <p>Showing up to {pageSize} tenant submissions for the active filters.</p>
              {submissionsQuery.data.nextCursor ? (
                <button
                  className="button button--secondary"
                  onClick={() =>
                    updateParams({
                      cursor: submissionsQuery.data?.nextCursor || undefined,
                    })
                  }
                  type="button"
                >
                  Load more submissions
                </button>
              ) : (
                <span className="pagination-panel__hint">No more results</span>
              )}
            </section>
          </>
        ) : (
          <EmptyState
            title="No submissions matched your filters"
            message="Try widening the review window, clearing the course filter, or checking back after new enrollments are submitted."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        )
      ) : null}
    </div>
  )
}
