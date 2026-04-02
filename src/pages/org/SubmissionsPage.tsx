import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { PageHero } from '../../components/layout/PageHero'
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
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function submissionTone(status: SubmissionStatus) {
  if (status === 'submitted') return 'info'
  if (status === 'reviewed') return 'success'
  return 'muted'
}

export function SubmissionsPage() {
  const { session } = useOrgSession()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [courseIdInput, setCourseIdInput] = useState(searchParams.get('courseId') ?? '')
  const [statusInput, setStatusInput] = useState<'all' | SubmissionStatus>(
    (searchParams.get('status') as 'all' | SubmissionStatus) ?? 'all',
  )
  const [submittedFromInput, setSubmittedFromInput] = useState(searchParams.get('submittedFrom') ?? '')
  const [submittedToInput, setSubmittedToInput] = useState(searchParams.get('submittedTo') ?? '')

  const status = (searchParams.get('status') ?? 'all') as 'all' | SubmissionStatus
  const submittedFrom = searchParams.get('submittedFrom') ?? ''
  const submittedTo = searchParams.get('submittedTo') ?? ''
  const cursor = searchParams.get('cursor') ?? undefined

  const submissionsQuery = useQuery({
    queryKey: [
      'org-submissions',
      session?.tenantId,
      searchParams.get('courseId'),
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

  function applyFilters() {
    const next = new URLSearchParams()
    if (courseIdInput.trim()) next.set('courseId', courseIdInput.trim())
    if (statusInput !== 'all') next.set('status', statusInput)
    if (submittedFromInput) next.set('submittedFrom', submittedFromInput)
    if (submittedToInput) next.set('submittedTo', submittedToInput)
    setSearchParams(next)
  }

  function clearFilters() {
    setCourseIdInput('')
    setStatusInput('all')
    setSubmittedFromInput('')
    setSubmittedToInput('')
    setSearchParams(new URLSearchParams())
  }

  function updateCursor(nextCursor: string) {
    const merged = new URLSearchParams(searchParams)
    merged.set('cursor', nextCursor)
    setSearchParams(merged)
  }

  return (
    <div className="page-stack">
      <PageHero
        badge="Org portal"
        title="Submissions"
        description="Review and process enrollment submissions from the public application forms."
      />

      <section className="content-panel">
        <form
          className="submissions-filter-bar"
          aria-label="Submission filters"
          onSubmit={(event) => {
            event.preventDefault()
            applyFilters()
          }}
        >
          <div className="submissions-filter-bar__field">
            <label htmlFor="sub-course-id">Course ID</label>
            <input
              id="sub-course-id"
              onChange={(event) => setCourseIdInput(event.target.value)}
              placeholder="crs_..."
              type="text"
              value={courseIdInput}
            />
          </div>
          <div className="submissions-filter-bar__field">
            <label htmlFor="sub-status">Status</label>
            <select
              id="sub-status"
              onChange={(event) =>
                setStatusInput(event.target.value as 'all' | SubmissionStatus)
              }
              value={statusInput}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="submissions-filter-bar__field">
            <label htmlFor="sub-from">From</label>
            <input
              id="sub-from"
              onChange={(event) => setSubmittedFromInput(event.target.value)}
              type="date"
              value={submittedFromInput}
            />
          </div>
          <div className="submissions-filter-bar__field">
            <label htmlFor="sub-to">To</label>
            <input
              id="sub-to"
              onChange={(event) => setSubmittedToInput(event.target.value)}
              type="date"
              value={submittedToInput}
            />
          </div>
          <div className="submissions-filter-bar__actions">
            <button className="button button--primary" type="submit">
              Search
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
          message="Fetching tenant submissions with the selected filters."
        />
      ) : null}

      {submissionsQuery.isError ? (
        <ErrorState
          title="Could not load submissions"
          message="The submissions request failed. Check the org session or retry."
        />
      ) : null}

      {!submissionsQuery.isLoading && !submissionsQuery.isError ? (
        submissionsQuery.data?.items.length ? (
          <>
            <section className="content-panel">
              <div className="section-header">
                <div className="section-header__copy">
                  <p className="section-heading__eyebrow">Results</p>
                  <h2>{submissionsQuery.data.items.length} submission{submissionsQuery.data.items.length !== 1 ? 's' : ''}</h2>
                </div>
              </div>
              <div className="responsive-table">
                <table className="data-table submissions-table">
                  <thead>
                    <tr>
                      <th scope="col">Applicant</th>
                      <th scope="col">Course</th>
                      <th scope="col">Status</th>
                      <th scope="col">Submitted</th>
                      <th scope="col" aria-label="Open detail" />
                    </tr>
                  </thead>
                  <tbody>
                    {submissionsQuery.data.items.map((submission) => (
                      <tr
                        key={submission.id}
                        className="submissions-table__row"
                        onClick={() => navigate(`/org/submissions/${submission.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            navigate(`/org/submissions/${submission.id}`)
                          }
                        }}
                        aria-label={`Open submission from ${submission.applicantName || 'unknown applicant'}`}
                      >
                        <td>
                          <strong>{submission.applicantName || 'Unknown applicant'}</strong>
                          {submission.applicantEmail ? (
                            <div className="table-subtext">{submission.applicantEmail}</div>
                          ) : null}
                        </td>
                        <td>{submission.courseTitle || submission.courseId}</td>
                        <td>
                          <StatusChip tone={submissionTone(submission.status)}>
                            {submission.status}
                          </StatusChip>
                        </td>
                        <td>{formatSubmissionDate(submission.submittedAt)}</td>
                        <td className="submissions-table__chevron" aria-hidden="true">›</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="pagination-panel" aria-label="Submission pagination">
              <p>Showing up to {pageSize} submissions.</p>
              {submissionsQuery.data.nextCursor ? (
                <button
                  className="button button--secondary"
                  onClick={() =>
                    updateCursor(submissionsQuery.data?.nextCursor || '')
                  }
                  type="button"
                >
                  Load more
                </button>
              ) : (
                <span className="pagination-panel__hint">No more results</span>
              )}
            </section>
          </>
        ) : (
          <EmptyState
            title="No submissions matched your filters"
            message="Try widening the date range, clearing the course filter, or checking back after new enrollments are submitted."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        )
      ) : null}
    </div>
  )
}
