import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  ApiClientError,
  getSubmission,
  updateSubmissionStatus,
  type Submission,
  type SubmissionStatusUpdatePayload,
} from '../../lib/api'

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function extractApplicantSummary(submission: Submission) {
  const firstName =
    typeof submission.answers?.first_name === 'string'
      ? submission.answers.first_name
      : undefined
  const email =
    submission.applicantEmail ||
    (typeof submission.applicant?.email === 'string'
      ? submission.applicant.email
      : undefined)

  return {
    name: submission.applicantName || firstName || 'Applicant',
    email: email || 'Email not provided',
  }
}

export function SubmissionDetailPage() {
  const { session } = useOrgSession()
  const { submissionId = '' } = useParams()
  const queryClient = useQueryClient()
  const submissionQuery = useQuery({
    queryKey: ['org-submission', session?.tenantId, submissionId],
    queryFn: async () => {
      if (!session) {
        throw new Error('Missing org session.')
      }

      const response = await getSubmission(session, submissionId)
      return response.data
    },
    enabled: Boolean(session && submissionId),
  })

  const updateMutation = useMutation<
    Submission,
    ApiClientError,
    SubmissionStatusUpdatePayload,
    { previousSubmission?: Submission }
  >({
    mutationFn: async (payload) => {
      if (!session) {
        throw new Error('Missing org session.')
      }

      const response = await updateSubmissionStatus(session, submissionId, payload)
      return response.data
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: ['org-submission', session?.tenantId, submissionId],
      })

      const previousSubmission = queryClient.getQueryData<Submission>([
        'org-submission',
        session?.tenantId,
        submissionId,
      ])

      if (previousSubmission) {
        queryClient.setQueryData<Submission>(
          ['org-submission', session?.tenantId, submissionId],
          {
            ...previousSubmission,
            status: payload.status,
          },
        )
      }

      return { previousSubmission }
    },
    onError: (_error, _payload, context) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(
          ['org-submission', session?.tenantId, submissionId],
          context.previousSubmission,
        )
      }
    },
    onSuccess: (submission) => {
      queryClient.setQueryData(
        ['org-submission', session?.tenantId, submissionId],
        submission,
      )
    },
  })

  const submission = submissionQuery.data
  const applicant = submission ? extractApplicantSummary(submission) : null

  return (
    <div className="page-stack">
      {submissionQuery.isLoading ? (
        <LoadingState
          title="Loading submission detail"
          message="Fetching the selected submission and current review state."
        />
      ) : null}

      {submissionQuery.isError ? (
        <ErrorState
          title="We could not load this submission"
          message="The detail request failed. Check the org session or retry from the submissions list."
        />
      ) : null}

      {submission ? (
        <>
          <PageHero
            badge="Submission detail"
            title={applicant?.name || submission.id}
            description="Review applicant responses, inspect timestamps, and apply the next workflow status when allowed."
            aside={
              <div className="hero-card">
                <p className="hero-card__label">Workflow state</p>
                <ul className="hero-card__list">
                  <li>Status: {submission.status}</li>
                  <li>Submitted: {formatDateTime(submission.submittedAt)}</li>
                  <li>Reviewed: {formatDateTime(submission.reviewedAt)}</li>
                </ul>
              </div>
            }
          />

          <section className="content-panel">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Applicant summary</p>
              <h2>Identity and workflow details</h2>
            </div>
            <div className="detail-summary-grid">
              <div className="field-card">
                <span>Applicant</span>
                <strong>{applicant?.name}</strong>
              </div>
              <div className="field-card">
                <span>Email</span>
                <strong>{applicant?.email}</strong>
              </div>
              <div className="field-card">
                <span>Course</span>
                <strong>{submission.courseTitle || submission.courseId}</strong>
              </div>
              <div className="field-card">
                <span>Form version</span>
                <strong>{submission.formVersion ?? 'N/A'}</strong>
              </div>
            </div>
            <div className="button-row">
              <Link className="button button--secondary" to="/org/submissions">
                Back to queue
              </Link>
            </div>
          </section>

          <section className="content-panel">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Status actions</p>
              <h2>Allowed transitions from the current state</h2>
            </div>
            <div className="button-row">
              <button
                className="button button--primary"
                disabled={
                  submission.status !== 'submitted' || updateMutation.isPending
                }
                onClick={() => updateMutation.mutate({ status: 'reviewed' })}
                type="button"
              >
                Mark reviewed
              </button>
              <button
                className="button button--ghost"
                disabled={
                  submission.status !== 'submitted' || updateMutation.isPending
                }
                onClick={() => updateMutation.mutate({ status: 'canceled' })}
                type="button"
              >
                Mark canceled
              </button>
            </div>
            {updateMutation.isError ? (
              <div className="enrollment-form__banner" role="alert">
                <strong>{updateMutation.error.message}</strong>
                <span>
                  The current record state was refreshed after the failed transition.
                </span>
              </div>
            ) : null}
          </section>

          <section className="content-panel">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Submitted answers</p>
              <h2>Response payload</h2>
            </div>
            {submission.answers && Object.keys(submission.answers).length ? (
              <dl className="answer-list">
                {Object.entries(submission.answers).map(([key, value]) => (
                  <div key={key} className="answer-list__item">
                    <dt>{key}</dt>
                    <dd>
                      {Array.isArray(value)
                        ? value.join(', ')
                        : typeof value === 'boolean'
                          ? value
                            ? 'Yes'
                            : 'No'
                          : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>No answer payload is available for this submission.</p>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
