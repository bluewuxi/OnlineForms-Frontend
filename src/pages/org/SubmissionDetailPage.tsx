import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { PageHero } from '../../components/layout/PageHero'
import { useCanWrite } from '../../features/org-session/useCanWrite'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  ApiClientError,
  getSubmission,
  refundSubmission,
  updateSubmissionStatus,
  type RefundResponse,
  type Submission,
  type SubmissionStatus,
  type SubmissionStatusUpdatePayload,
} from '../../lib/api'

function formatDate(value?: string | null) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function submissionTone(status: SubmissionStatus) {
  if (status === 'submitted') return 'info' as const
  if (status === 'reviewed') return 'success' as const
  return 'muted' as const
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
  const canWrite = useCanWrite()
  const { submissionId = '' } = useParams()
  const queryClient = useQueryClient()
  const [refundConfirm, setRefundConfirm] = useState(false)
  const [refundResult, setRefundResult] = useState<RefundResponse | null>(null)
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

  const refundMutation = useMutation<RefundResponse, ApiClientError>({
    mutationFn: async () => {
      if (!session) throw new Error('Missing org session.')
      const response = await refundSubmission(session, submissionId)
      return response.data
    },
    onSuccess: (result) => {
      setRefundConfirm(false)
      setRefundResult(result)
    },
  })

  const submission = submissionQuery.data
  const applicant = submission ? extractApplicantSummary(submission) : null

  return (
    <div className="page-stack">
      {submissionQuery.isLoading ? (
        <LoadingState
          title="Loading submission"
          message="Fetching the selected submission and current review state."
        />
      ) : null}

      {submissionQuery.isError ? (
        <ErrorState
          title="Could not load this submission"
          message="The detail request failed. Check the org session or retry from the submissions list."
        />
      ) : null}

      {submission ? (
        <>
          <PageHero
            badge="Submission detail"
            title={applicant?.name || submission.id}
            description="Review applicant responses and update the workflow status."
            aside={
              <div className="hero-card">
                <p className="hero-card__label">Workflow state</p>
                <div className="enrollment-window">
                  <div className="enrollment-window__row">
                    <span className="enrollment-window__label">Status</span>
                    <StatusChip tone={submissionTone(submission.status)}>
                      {submission.status}
                    </StatusChip>
                  </div>
                  <div className="enrollment-window__row">
                    <span className="enrollment-window__label">Submitted</span>
                    <span className="enrollment-window__value">{formatDate(submission.submittedAt)}</span>
                  </div>
                  <div className="enrollment-window__row">
                    <span className="enrollment-window__label">Reviewed</span>
                    <span className="enrollment-window__value">{formatDate(submission.reviewedAt)}</span>
                  </div>
                </div>
              </div>
            }
          />

          <section className="content-panel">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Applicant</p>
              <h2>Identity and course details</h2>
            </div>
            <div className="detail-summary-grid">
              <div className="field-card">
                <span>Name</span>
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
            <div className="button-row" style={{ marginTop: '1rem' }}>
              <Link className="button button--ghost" to="/org/submissions">
                ← Back to queue
              </Link>
            </div>
          </section>

          <section className="content-panel">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Submitted answers</p>
              <h2>Application responses</h2>
            </div>
            {submission.answers && Object.keys(submission.answers).length ? (
              <dl className="submission-answer-list">
                {Object.entries(submission.answers).map(([key, value]) => (
                  <div key={key} className="submission-answer-list__item">
                    <dt className="submission-answer-list__label">{key}</dt>
                    <dd className="submission-answer-list__value">
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

          {/* Sticky status action bar */}
          <div className="submission-action-bar">
            <div className="submission-action-bar__status">
              <span className="submission-action-bar__label">Current status</span>
              <StatusChip tone={submissionTone(submission.status)}>
                {submission.status}
              </StatusChip>
            </div>
            {canWrite ? (
              <div className="button-row">
                <button
                  className="button button--primary"
                  disabled={submission.status !== 'submitted' || updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ status: 'reviewed' })}
                  type="button"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Mark reviewed'}
                </button>
                <button
                  className="button button--ghost"
                  disabled={submission.status !== 'submitted' || updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ status: 'canceled' })}
                  type="button"
                >
                  Mark canceled
                </button>
                <button
                  className="button button--ghost"
                  disabled={refundMutation.isPending}
                  onClick={() => setRefundConfirm(true)}
                  type="button"
                >
                  Refund
                </button>
              </div>
            ) : null}
            {updateMutation.isError ? (
              <p className="submission-action-bar__error" role="alert">
                {updateMutation.error.message}
              </p>
            ) : null}
          </div>

          {/* Refund confirmation dialog */}
          {refundConfirm ? (
            <section className="content-panel content-panel--narrow">
              <div className="section-heading">
                <p className="section-heading__eyebrow">Confirm refund</p>
                <h2>Issue a refund for this enrollment?</h2>
              </div>
              <p className="content-panel__body-copy">
                This will initiate a full refund via Stripe. The action cannot be undone.
              </p>
              <div className="button-row" style={{ marginTop: '1rem' }}>
                <button
                  className="button button--primary"
                  disabled={refundMutation.isPending}
                  onClick={() => refundMutation.mutate()}
                  type="button"
                >
                  {refundMutation.isPending ? 'Processing refund...' : 'Confirm refund'}
                </button>
                <button
                  className="button button--ghost"
                  disabled={refundMutation.isPending}
                  onClick={() => setRefundConfirm(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
              {refundMutation.isError ? (
                <p className="submission-action-bar__error" role="alert">
                  {refundMutation.error.message}
                </p>
              ) : null}
            </section>
          ) : null}

          {/* Refund success confirmation */}
          {refundResult ? (
            <section className="content-panel content-panel--narrow">
              <div className="section-heading">
                <p className="section-heading__eyebrow">Refund issued</p>
                <h2>Payment refunded successfully</h2>
              </div>
              <div className="detail-summary-grid">
                <div className="field-card">
                  <span>Refund ID</span>
                  <strong>{refundResult.refundId}</strong>
                </div>
                <div className="field-card">
                  <span>Amount</span>
                  <strong>{(refundResult.amount / 100).toFixed(2)} {refundResult.currency.toUpperCase()}</strong>
                </div>
                <div className="field-card">
                  <span>Status</span>
                  <strong>{refundResult.status}</strong>
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
