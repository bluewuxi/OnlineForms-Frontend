import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import {
  ApiClientError,
  createEnrollment,
  type EnrollmentResponse,
  type FormField,
  type FormSchema,
} from '../../lib/api'
import {
  createEnrollmentMeta,
  normalizeEnrollmentAnswers,
} from './submission'

type FormPreviewProps = {
  schema: FormSchema | null
  tenantCode: string
  courseId: string
  courseTitle?: string
  enrollmentStatus?: 'upcoming' | 'open' | 'closed'
  formAvailable?: boolean
}

function renderField(
  field: FormField,
  register: ReturnType<typeof useForm<Record<string, unknown>>>['register'],
) {
  const rules = {
    required: field.required,
    minLength: field.validation?.minLength ?? undefined,
    maxLength: field.validation?.maxLength ?? undefined,
    min: field.validation?.min ?? undefined,
    max: field.validation?.max ?? undefined,
    pattern: field.validation?.pattern
      ? new RegExp(field.validation.pattern)
      : undefined,
  }

  switch (field.type) {
    case 'long_text':
      return (
        <textarea
          id={field.fieldId}
          rows={4}
          {...register(field.fieldId, rules)}
        />
      )
    case 'number':
      return <input id={field.fieldId} type="number" {...register(field.fieldId, rules)} />
    case 'email':
      return <input id={field.fieldId} type="email" {...register(field.fieldId, rules)} />
    case 'phone':
      return <input id={field.fieldId} type="tel" {...register(field.fieldId, rules)} />
    case 'date':
      return <input id={field.fieldId} type="date" {...register(field.fieldId, rules)} />
    case 'single_select':
      return (
        <select id={field.fieldId} {...register(field.fieldId, rules)}>
          <option value="">Select an option</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    case 'multi_select':
      return (
        <select id={field.fieldId} multiple {...register(field.fieldId, rules)}>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    case 'checkbox':
      return <input id={field.fieldId} type="checkbox" {...register(field.fieldId, rules)} />
    case 'short_text':
    default:
      return <input id={field.fieldId} type="text" {...register(field.fieldId, rules)} />
  }
}

function getFieldErrorMessage(field: FormField) {
  if (field.required) {
    return `${field.label} is required.`
  }

  return `Enter a valid value for ${field.label}.`
}

export function FormPreview({
  schema,
  tenantCode,
  courseId,
  courseTitle,
  enrollmentStatus,
  formAvailable,
}: FormPreviewProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Record<string, unknown>>()
  const enrollmentMutation = useMutation<
    EnrollmentResponse,
    ApiClientError,
    Record<string, unknown>
  >({
    mutationFn: async (values) => {
      if (!schema) {
        throw new ApiClientError(
          400,
          {
            error: {
              code: 'form_schema_missing',
              message: 'No active enrollment form is available for this course.',
            },
          },
          'No active enrollment form is available for this course.',
        )
      }

      const response = await createEnrollment(tenantCode, courseId, {
        formVersion: schema.version,
        answers: normalizeEnrollmentAnswers(values),
        meta: createEnrollmentMeta(),
      })

      return response.data
    },
    onSuccess() {
      reset()
    },
  })

  if (enrollmentStatus === 'closed') {
    return (
      <section className="content-panel enrollment-form-shell">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Enrolment unavailable</p>
          <h2>This intake is currently closed</h2>
        </div>
        <p className="content-panel__body-copy">
          This course is visible for reference, but new applications are not
          being accepted right now.
        </p>
      </section>
    )
  }

  if (enrollmentStatus === 'upcoming') {
    return (
      <section className="content-panel enrollment-form-shell">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Enrolment opening soon</p>
          <h2>Applications are not open yet</h2>
        </div>
        <p className="content-panel__body-copy">
          Check back when this intake opens. Once enrolment begins, the form
          will be available on this page.
        </p>
      </section>
    )
  }

  if (formAvailable === false || !schema || schema.fields.length === 0) {
    return (
      <section className="content-panel enrollment-form-shell">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Enrolment form</p>
          <h2>Application form is not ready yet</h2>
        </div>
        <p className="content-panel__body-copy">
          This course does not have an active public application form available
          for submission yet.
        </p>
      </section>
    )
  }

  const onSubmit = handleSubmit((values) => {
    enrollmentMutation.mutate(values)
  })

  if (enrollmentMutation.isSuccess) {
    return (
      <section className="content-panel enrollment-form-shell enrollment-form-shell--success">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Application received</p>
          <h2>Your enrolment has been submitted</h2>
        </div>
        <p className="content-panel__body-copy">
          {enrollmentMutation.data.courseTitle || courseTitle ? (
            <>
              Your response for{' '}
              <strong>{enrollmentMutation.data.courseTitle || courseTitle}</strong>{' '}
              is now in the review queue.
            </>
          ) : (
            'Your response is now in the review queue.'
          )}
        </p>
        <div className="detail-summary-grid">
          <div className="field-card">
            <span>Submission ID</span>
            <strong>{enrollmentMutation.data.submissionId}</strong>
          </div>
          <div className="field-card">
            <span>Status</span>
            <strong>{enrollmentMutation.data.status}</strong>
          </div>
        </div>
        <div className="editorial-steps editorial-steps--compact" aria-label="What happens next">
          <div className="editorial-step">
            <span className="editorial-step__index">01</span>
            <div>
              <strong>Save your reference</strong>
              <p>Keep the submission ID if you need to refer to this application later.</p>
            </div>
          </div>
          <div className="editorial-step">
            <span className="editorial-step__index">02</span>
            <div>
              <strong>Return to the course or provider page</strong>
              <p>Use the links below if you want to keep browsing or review the course again.</p>
            </div>
          </div>
        </div>
        <div className="button-row">
          {enrollmentMutation.data.links?.tenantHome ? (
            <Link
              className="button button--primary"
              to={enrollmentMutation.data.links.tenantHome}
            >
              Back to provider
            </Link>
          ) : null}
          {enrollmentMutation.data.links?.course ? (
            <Link className="button button--secondary" to={enrollmentMutation.data.links.course}>
              Review course again
            </Link>
          ) : null}
          <button
            className="button button--ghost"
            onClick={() => enrollmentMutation.reset()}
            type="button"
          >
            Submit another response
          </button>
        </div>
      </section>
    )
  }

  const requiredCount = schema.fields.filter((field) => field.required).length

  return (
    <section className="content-panel enrollment-form-shell">
      <div className="section-heading">
        <p className="section-heading__eyebrow">Enrolment form</p>
        <h2>Complete your application</h2>
      </div>
      <div className="button-row button-row--spread enrollment-form-shell__intro">
        <p className="content-panel__body-copy">
          Complete the required questions below, then submit your response in one
          step.
        </p>
        <div className="enrollment-form-shell__stats" aria-label="Form summary">
          <span>{schema.fields.length} questions</span>
          <span>{requiredCount} required</span>
          <span>Version {schema.version}</span>
        </div>
      </div>

      <form className="enrollment-form" onSubmit={onSubmit}>
        {schema.fields.map((field, index) => (
          <label key={field.fieldId} className="enrollment-form__field enrollment-form__field--card">
            <div className="enrollment-form__field-header">
              <span className="enrollment-form__field-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                {field.label}
                {field.required ? ' *' : ''}
              </span>
            </div>
            {renderField(field, register)}
            {field.helpText ? (
              <small className="enrollment-form__hint">{field.helpText}</small>
            ) : null}
            {errors[field.fieldId] ? (
              <small className="enrollment-form__error">
                {getFieldErrorMessage(field)}
              </small>
            ) : null}
          </label>
        ))}

        {enrollmentMutation.isError ? (
          <div className="enrollment-form__banner" role="alert">
            <strong>{enrollmentMutation.error.message}</strong>
            <span>Check the highlighted answers and try submitting again.</span>
            {import.meta.env.DEV ? (
              <span>
                {enrollmentMutation.error.code
                  ? ` (${enrollmentMutation.error.code})`
                  : ''}
                {enrollmentMutation.error.correlationId
                  ? ` correlation ${enrollmentMutation.error.correlationId}`
                  : ''}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="enrollment-form__actions">
          <button
            className="button button--primary"
            disabled={enrollmentMutation.isPending}
            type="submit"
          >
            {enrollmentMutation.isPending ? 'Submitting application...' : 'Submit enrolment'}
          </button>
        </div>
      </form>
    </section>
  )
}
